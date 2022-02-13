from itertools import chain
import pickle
import re
import numpy as np


def binary_search(arr):
    """
    Binary search
    """
    mini, mid, maxi = 0, 0, arr.shape[0]
    rand = arr[-1] * np.random.random()
    while mini < maxi:
        mid = mini + ((maxi - mini) >> 1)
        if rand > arr[mid]:
            mini = mid + 1
        else:
            maxi = mid
    return mini

def cos_sim(u, v):
    """
    Calculate the cosine similarity between vectors u and v
    """
    norm_u = np.linalg.norm(u)
    norm_v = np.linalg.norm(v)
    if (norm_u == 0) or (norm_v == 0):
        cos_sim = 1.0
    else:
        cos_sim = np.dot(u, v) / (norm_u * norm_v)
    return cos_sim


class Predictor_spy:
    """
    Generate a list of guesses
    """
    def __init__(self, board, clue, target_num, relevant_vectors_path):
        self.board = board
        self.clue = str(clue).replace(" ", "").lower()
        self.target_num = int(target_num)
        self.relevant_vectors_path = relevant_vectors_path

    def _get_unpicked_cards(self):
        """
        Extract cards that is unpicked
        """
        unpicked_cards = []
        for card in self.board:
            if not card["isRevealed"]:
                unpicked_cards.append(card)
        return unpicked_cards

    def _get_relevant_vectors(self):
        """
        Get the relevant vectors
        """
        with open(self.relevant_vectors_path, 'rb') as f:
            relevant_vectors = pickle.load(f)
        return relevant_vectors

    def _setup(self):
        """
        Setup the relevant data structures
        """
        self.relevant_vectors = self._get_relevant_vectors()
        self.unpicked_cards = self._get_unpicked_cards()

    def _calculate_card_score(self, clue):
        """
        Calculate cosine similarity between clue and words in every unpicked card
        """
        card_score = {}
        for card in self.unpicked_cards:
            word = card["word"].replace(" ", "")
            score = cos_sim(self.relevant_vectors[clue], self.relevant_vectors[word])
            card_score[card["word"]] = score
        return card_score

    def run(self):
        """
        Get a list of guesses according to clue and target number
        """
        self._setup()
        x = self._calculate_card_score(self.clue)
        card_score = dict(sorted(x.items(), key=lambda item:item[1], reverse=True))
        if (self.target_num == 0):
            self.target_num = 1
        guesses = list(card_score.keys())[:self.target_num]
        print("Using clue:", self.clue)
        for guess in guesses:
            print("Guess:", guess)
        return guesses


class Predictor_sm:
    """
    Generate clues and list of target words
    """
    def __init__(self,
                 relevant_words_path,
                 relevant_vectors_path,
                 board,
                 turn,
                 threshold=0.45,
                 trials=100):
        """
        Parameters
        ----------
        relevant_words_path: str
                          : The path to the dictionary of relevant words
        relevant_vectors_path: str
                             : The path to the dictionary of relevant vectors
        board: json
             : The current board state
        threshold: float (default = 0.4)
           : The threshold before which the similarity is 0
        trials: int (default = 100)
              : The number of trials to use for the Monte-Carlo method
        """
        self.relevant_words_path = relevant_words_path
        self.relevant_vectors_path = relevant_vectors_path
        self.board = board
        self.turn = turn
        self.threshold = threshold
        self.trials = trials

        self.inactive_words = None
        self.words = None
        self.blue, self.red, self.neutral, self.assassin = None, None, None, None
        self.valid_guesses = None

    def _calculate_expected_score(self, similarities, n_blue, trials):
        """
        Calculate the expected score with a Monte-Carlo method
        """
        expected_score = 0
        for _ in range(trials):
            trial_score = 0
            cumsum = np.cumsum(similarities)
            while True:
                sample = binary_search(cumsum)
                if sample < n_blue:
                    if sample == 0:
                        cumsum[sample] = 0
                    else:
                        difference = cumsum[sample] - cumsum[sample - 1]
                        cumsum[sample:] -= difference
                    trial_score += 1
                else:
                    break
            expected_score += trial_score
        expected_score /= trials
        return expected_score

    def _get_words(self):
        """
        Extract the words from every card
        """
        all_words = [card["word"].replace(" ", "") for card in self.board]
        return all_words

    def _get_types(self):
        """
        Extract the types from the cards
        """
        blue = []
        red = []
        neutral = []
        assassin = ""
        for card in self.board:
            name = card["word"].replace(" ", "")
            if card["colour"] == "blueTeam" and not card["isRevealed"]:
                blue.append(name)
            if card["colour"] == "redTeam" and not card["isRevealed"]:
                red.append(name)
            if card["colour"] == "neutral" and not card["isRevealed"]:
                neutral.append(name)
            if card["colour"] == "bombCard" and not card["isRevealed"]:
                assassin = name
        if self.turn == "red":
            return red, blue, neutral, assassin
        else:
            return blue, red, neutral, assassin

    def _get_valid_guesses(self):
        """
        Get the relevant valid guesses
        """
        with open(self.relevant_words_path, 'rb') as f:
            relevant_words = pickle.load(f)
        potential_guesses = set(chain.from_iterable(relevant_words[w] for w in self.blue))
        if len(potential_guesses) == 0:
            print("Generate neutral clue")
            potential_guesses = set(chain.from_iterable(relevant_words[w] for w in self.neutral))
        return potential_guesses

    def _get_relevant_vectors(self):
        """
        Get the relevant vectors
        """
        with open(self.relevant_vectors_path, 'rb') as f:
            relevant_vectors = pickle.load(f)
        #print(len(relevant_vectors))
        return relevant_vectors

    def _setup(self):
        """
        Setup the relevant data structures
        """
        self.relevant_vectors = self._get_relevant_vectors()
        self.words = self._get_words()

        self.blue, self.red, self.neutral, self.assassin = self._get_types()
        if self.assassin == "":
            self.bad_words = self.red + self.neutral
        else:
            self.bad_words = self.red + [self.assassin] + self.neutral

        self.blue_vectors = np.array([self.relevant_vectors[w] for w in self.blue], dtype=np.float32)
        self.bad_vectors = np.array([self.relevant_vectors[w] for w in self.bad_words], dtype=np.float32)

        self.valid_guesses = self._get_valid_guesses()

    def _calculate_guess_score(self, guess):
        """
        Generate a score for a guess
        """
        guess_vector = self.relevant_vectors[guess]

        blue_similarities = np.array([cos_sim(guess_vector, v) for v in self.blue_vectors], dtype=np.float32)
        bad_similarities = np.array([cos_sim(guess_vector, v) for v in self.bad_vectors], dtype=np.float32)

        best_blue_similarities = blue_similarities[blue_similarities > self.threshold]
        best_bad_similarities = bad_similarities[bad_similarities > self.threshold]
        best_similarities = np.concatenate([best_blue_similarities, best_bad_similarities])

        if len(best_bad_similarities) == 0:
            score = (len(best_blue_similarities), np.sum(best_blue_similarities))
        elif len(best_blue_similarities) == 0:
            score = (0, 0)
        else:
            score = (self._calculate_expected_score(best_similarities, len(best_blue_similarities), self.trials), 0)

        return score, guess

    def _get_targets(self, guess, clue_score):
        """
        Get the target words for a given guess and modal score
        """
        best_guess_vector = self.relevant_vectors[guess]
        blue_similarities = np.array([cos_sim(best_guess_vector, self.relevant_vectors[w])
                                      for w in self.blue])
        sorted_idx = np.argsort(-blue_similarities)
        best_blue = set(np.array(self.blue)[sorted_idx][:clue_score])

        targets = []
        for card in self.board:
            if card['word'].replace(' ', '') in best_blue:
                targets.append(card["word"])
        return targets

    def run(self):
        """
        Get the best clue, it's score (rounded down to an integer) and the words it is supposed to link to
        """
        self._setup()
        guess_scores = [self._calculate_guess_score(g) for g in self.valid_guesses]
        score, clue = max(guess_scores, key=lambda x: x[0])
        clue_score = int(score[0])
        targets = self._get_targets(clue, clue_score)
        print("Generated clue:", clue)
        print("Targets:", targets)

        return clue, clue_score, targets
