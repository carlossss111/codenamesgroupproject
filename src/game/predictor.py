import random
import pickle
import numpy as np
from itertools import chain
from sklearn.cluster import DBSCAN


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


class SpyAI:
    """
    Generate a list of guesses
    """
    def __init__(self, 
                 board, 
                 clue, 
                 target_num, 
                 level, 
                 relevant_vectors_path):
        """
        Parameters
        ----------
        board: json
            : The current board state
        clue: str
            : The clue given by teammate
        target_num: int
            : The target number given by teammate
        level: str
            : The accuracy level for AI spy
        relevant_vectors_path: str
            : The path to the dictionary of relevant vectors
        """
        self.board = board
        self.clue = str(clue).replace(" ", "").lower()
        self.target_num = int(target_num)
        self.level = level
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
        print("\n----- Spy AI working -----")
        self._setup()
        x = self._calculate_card_score(self.clue)
        card_score = dict(sorted(x.items(), key=lambda item:item[1], reverse=True))
        if (self.target_num == 0):
            self.target_num = 1
        guesses = list(card_score.keys())[:self.target_num]
        print("Guess sequence:", list(card_score.keys()))

        if len(x) >= 2*self.target_num:
            for i in range(self.target_num):
                if (self.level == "Easy" and random.random() < 0.3) or (self.level == "Medium" and random.random() < 0.2):
                    guesses[i] = list(card_score.keys())[self.target_num+i]

        print("Using clue [", self.clue, "] with mode [", self.level, ']')
        print("Guess:", guesses)
        return guesses


class SpymasterAI:
    """
    Generate a clue and list of target words
    """
    def __init__(self,
                 relevant_words_path,
                 relevant_vectors_path,
                 board,
                 turn,
                 threshold=0.4):
        """
        Parameters
        ----------
        relevant_words_path: str
            : The path to the dictionary of relevant words
        relevant_vectors_path: str
            : The path to the dictionary of relevant vectors
        board: json
            : The current board state
        threshold: float
            : The threshold before which the similarity is 0, 
              words having cosine similarity less than threshold could seen as not related
        """
        self.relevant_words_path = relevant_words_path
        self.relevant_vectors_path = relevant_vectors_path
        self.board = board
        self.turn = turn
        self.threshold = threshold

        self.words = None
        self.good, self.bad, self.neutral, self.assassin = None, None, None, None
        self.valid_guesses = None

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
        potential_guesses = set(chain.from_iterable(relevant_words[w] for w in self.good))
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

        self.good, self.bad, self.neutral, self.assassin = self._get_types()
        if self.assassin == "":
            self.bad_words = self.bad + self.neutral
        else:
            self.bad_words = [self.assassin] + self.bad + self.neutral

        self.good_vectors = np.array([self.relevant_vectors[w] for w in self.good], dtype=np.float32)
        self.bad_vectors = np.array([self.relevant_vectors[w] for w in self.bad_words], dtype=np.float32)
        self.valid_guesses = self._get_valid_guesses()

        clustering = DBSCAN(eps=1-self.threshold, min_samples=2, metric='cosine').fit(self.good_vectors)
        self.cluster_labels = clustering.labels_
        print("Clustering labels:", clustering.labels_)
        print("Corresponding words:", self.good)

    def _calculate_guess_score(self, guess):
        """
        Generate a score for a guess
        """
        guess_vector = self.relevant_vectors[guess]

        good_similarities = np.array([cos_sim(guess_vector, v) for v in self.good_vectors], dtype=np.float32)
        bad_similarities = np.array([cos_sim(guess_vector, v) for v in self.bad_vectors], dtype=np.float32)

        best_good_similarities = good_similarities[good_similarities > self.threshold]
        best_bad_similarities = bad_similarities[bad_similarities > self.threshold]
        #print(len(best_good_similarities), len(best_bad_similarities))

        score = np.sum(best_good_similarities) - np.sum(best_bad_similarities)
        for index in range(len(good_similarities)):
            if self.cluster_labels[index] == 0:
                score += good_similarities[index]
        if self.assassin != "":
            score -= bad_similarities[0]
        return score, guess

    def _get_targets(self, clue):
        """
        Get the target words for a given guess and modal score
        """
        best_guess_vector = self.relevant_vectors[clue]
        unpicked_words = self.good + self.bad_words
        word_similarities = np.array([cos_sim(best_guess_vector, self.relevant_vectors[w]) for w in unpicked_words])
        sorted_idx = np.argsort(-word_similarities)
        targets = []
        for index in sorted_idx:
            if unpicked_words[index] in self.good:
                targets.append(unpicked_words[index])
            else:
                break
        return targets

    def run(self):
        """
        Get the best clue, it's score (rounded down to an integer) and the words it is supposed to link to
        """
        print("\n----- Spymaster AI working -----")
        self._setup()
        guess_scores = [self._calculate_guess_score(g) for g in self.valid_guesses]
        _, clue = max(guess_scores, key=lambda x: x[0])
        targets = self._get_targets(clue)
        print("Generated clue:", clue)
        print("Targets:", targets)
        return clue, targets
