# Team 18 Codenames Project
This project emulates the [Codenames](https://en.wikipedia.org/wiki/Codenames_(board_game)) boardgame in a web browser. It allows for up to 4 players to play against each other taking the roles of either “spy” or “spymaster”. Players can also challenge AI opponents in different role and difficulty configurations.

Welcome to our project website http://www.codenames.uk to try our game online and learn more about it.

## Installation
### Latest Version (local host)
To test the latest version of the application, clone this repository and install the [required dependencies](#dependencies).

A python server is required to run the game. Run the following command in the terminal in the project's root directory:
``` 
python3 app.py
```
If there are no error messages, the server is running with the correct dependencies installed. If dependencies are missing, the error messages should tell you which.

Then load _index.html_ into a browser of your choice and the game should be playable with AI. Multiple browser windows can also be opened to simulate multiplayer.

For running the production WSGI server please refer to _Software Manual_ part of our [Final Report](/docs/Final%20Report.pdf).

### Stable Version (online)
A stable version of the application available for immediate use is deployed on two servers:
- [🇬🇧 UK - South (London)](http://178.128.33.85/codenames/)
- [🇺🇸 US - East (Virginia)](http://3.83.45.21/games/team18_project/)

This version may not yet have some of the features that are present in the latest version, but it requires no installation and allows multiplayer between computers on different networks.

## Project Structure
The python server is run from _/app.py_ and it uses python code from _/src/game_.

The client-hosted content is run in HTML files located in _/pages_ which uses JavaScript and CSS from _/src/web_ and resources from _/rsc_.
Unit tests are run in _/test_ and documentation is located in _/docs_.
```
├── app.py
├── index.html
├── README.md
├── docs/ 
├── pages/
├── rsc/
│   ├── audio/
│   ├── data/
│   ├── images/
├── src/
│   ├── game/
│   └── web/
└── test/
```

## Documentation
For documentation, see [/docs](/docs/).

## Dependencies
### Compulsory
-   Python3 - https://www.python.org
-	Flask - https://flask.palletsprojects.com/en/2.1.x/
-	Flask-SocketIO - https://flask-socketio.readthedocs.io/en/latest/
-	NumPy - https://numpy.org/
-	Scikit-learn - https://scikit-learn.org/stable/
### Test
-	MochaJS - https://mochajs.org/api/
-	ChaiJS - https://www.chaijs.com/guide/styles/#assert
### Deploy
-	Gunicorn - https://gunicorn.org/
-	Eventlet - https://eventlet.net/

## Contributors
This project is designed and programmed by [Alexandru Stoica](https://projects.cs.nott.ac.uk/psyas13), [Ao Li](https://projects.cs.nott.ac.uk/scyal3), [Daniel Robinson](https://projects.cs.nott.ac.uk/psydr2), [Hongjia Xue](https://projects.cs.nott.ac.uk/scyhx5), [Ing Sam Yin](https://projects.cs.nott.ac.uk/hfysi2), [Shahil Pramodkumar](https://projects.cs.nott.ac.uk/psysp7), and [Tianxiang Song](https://projects.cs.nott.ac.uk/scyts1).

The project is under supervision by Associate Professor [Colin Johnson](https://www.nottingham.ac.uk/computerscience/people/colin.johnson).

We would love to hear from you if you have any questions, suggestions or concerns.