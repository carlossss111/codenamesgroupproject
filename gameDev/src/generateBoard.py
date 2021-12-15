import random
import socket

ip_port = ('127.0.0.1', 8000)
sk = socket.socket
sk.bind(ip_port)


class generateBoard:

    def __init__(self, files):
        """
            This is the constructor.
        """
        self.files = files
        self.board = self.createWordList()
        self.numOfGuesses = 1
        self.redScore = 1
        self.blueScore = 1
        self.nextTurn = {"team": "?", "role": "?"}

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
