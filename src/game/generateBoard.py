import random
import socket
import numpy as np
import argparse

ip_port = ('127.0.0.1', 8000)
#sk = socket.socket
#sk.bind(ip_port)


class generateBoard:

    def __init__(self, i):
        """
            This is the constructor.
        """

        self.board = self.createWordList()
        self.numOfGuesses, self.redScore, self.blueScore, self.nextTurn = self.reset(i)

    def createWordList(self):
        global colour
        wordlist = []
        board = []
        typeList = []
        data = []
        for a in range(9):
            typeList.append('red')
        for b in range(8):
            typeList.append('blue')
        for c in range(7):
            typeList.append('neutral')
        typeList.append('assassin')
        f = open("static/data/codenames_words")
        for line in f:
            data.append(line.strip())

        for a in wordlist:
            a.replace("\n", "\r")
        f.close()

        wordlist = random.sample(data, 25)
        n = 25
        for i in range(25):
            t = random.choice(range(n))
            n = n - 1
            type = typeList[t]
            del typeList[t]
            if type == 'blue':
                colour = "#0080FF"
            elif type == 'red':
                colour = "#FF0000"
            elif type == 'neutral':
                colour = "#D0D0D0"
            elif type == 'assassin':
                colour = "#202020"
            word = wordlist[i]
            word_details = {"name": word, "type": type, "colour": colour, "active": False, "id": i + 1}
            board.append(word_details)
        print(board)
        return board

    def reset(self, i):
        a = self.numOfGuesses
        b = self.redScore
        c = self.blueScore
        d = self.nextTurn
        if i:
            a = 1
            b = 1
            c = 1
            d = {"team": "?", "role": "?"}
        return a, b, c, d


class Boardgen:
    """
    Generate a random board
    """
    def __init__(self, in_file):
        """
        Parameters
        ----------
        in_file: str
            The path to the possible board words
        """
        self.in_file = in_file
        self.board = self.generate_board()
        self.word_dict = self.get_word_dic()

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
                type = "blue"
                colour = "#0080FF"
            elif i < 18:
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

        # Assign ids (+1 because of the header)
        for i in range(25):
            board[i]["id"] = i+1

        return board

    def get_word_dic(self):
        with open("static/data/word_dict", 'r') as f:
            words = [line.rstrip() for line in f]
            return words