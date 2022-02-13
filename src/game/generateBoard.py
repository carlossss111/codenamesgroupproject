import random
import socket
import numpy as np
import argparse


class generateBoard:
    """
    Generate a random board
    """
    def __init__(self, in_file, isBombCard):
        """
        Parameters
        ----------
        in_file: str
            The path to the possible board words
        """
        self.in_file = in_file
        self.isBombCard = isBombCard
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
                if self.isBombCard:
                    type = "bombCard"
                else:
                    type = "neutral"

            word_details = {"name": word, "type": type}
            board.append(word_details)

        np.random.shuffle(board)

        return board


def getVocabulary():
    with open("static/data/word_dict", 'r') as f:
        words = [line.rstrip() for line in f]
        return words