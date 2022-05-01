import numpy as np


class BoardGenerator:
    """
    Generate a random game board
    """
    def __init__(self, in_file, is_bomb_card):
        """
        Parameters
        ----------
        in_file: str
            The path to the possible board words
        is_bomb_card: boolean:
            If the bomb card is set
        """
        self.in_file = in_file
        self.is_bomb_card = is_bomb_card
        self.board = self.generate_board()

    def generate_board(self):
        """
        Create a game board
        """
        try:
            all_words = [word.strip().lower() for word in open(self.in_file)]
        except UnicodeDecodeError:
            raise Exception("Make sure that in_file is a text file")
        except FileNotFoundError:
            raise Exception("Make sure that in_file exists")

        permutation = np.random.permutation(len(all_words))
        words = np.array(all_words)[permutation][:25]

        # 9 Blue, 9 Red, 6 Neutral, 1 Assassin
        board = []
        for i, word in enumerate(words):
            if i < 9:
                type = "blueTeam"
            elif i < 18:
                type = "redTeam"
            elif i < 24:
                type = "neutral"
            else:
                if self.is_bomb_card:
                    type = "bombCard"
                else:
                    type = "neutral"

            word_details = {"name": word, "type": type}
            board.append(word_details)

        np.random.shuffle(board)

        return board


"""
Get vocabulary for the AI spymaster
"""
def get_vocabulary():
    with open("rsc/data/word_dict", 'r') as f:
        words = [line.rstrip() for line in f]
        return words