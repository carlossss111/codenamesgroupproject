# Code idea coming from: https://github.com/Pbatch/Codenames
# Refactoring and rebuild the source code to satisfy our json and html pages

import numpy as np
import socket

ip_port = ('127.0.0.1', 8000)
sk = socket.socket
sk.bind(ip_port)
sk.listen()


class generateBoard:

    def __init__(self, files):
        self.files = files
        self.board = self.generate_board()

    def generate_board(self):
        # Initialize the game board
        try:
            all_words = [word.strip().lower() for word in open(self.files)]
        except FileNotFoundError:
            raise Exception("file not exist!")

        permutation = np.random.permutation(len(all_words))
        words = np.array(all_words)[permutation][:25]
        board = []

        for i, word in enumerate(words):
            if i < 9:
                type = "blue"
                colour = "#0080FF"
            elif i < 17:
                type = "red"
                colour = "#FF0000"
            elif i < 24:
                type = "neutral"
                colour = "#D0D0D0"
            else:
                type = "assassin"
                colour = "#202020"

            word_details = {"name": word, "type": type, "colour": colour, "active": False}
            board.append(word_details)

        np.random.shuffle(board)

        for i in range(25):
            board[i]["id"] = i + 1

        return board
