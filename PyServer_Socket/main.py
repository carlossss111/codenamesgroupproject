import socket
import urllib.parse
from routes import route_index
from routes import route_dict


class Request(object):
    def __init__(self):
        # request normally is GET or POST
        self.method = 'GET'
        self.path = ''
        self.body = ''

    def form(self):
        body = urllib.parse.unquote(self.body)
        args = body.split('&')
        f = {}
        for arg in args:
            k, v = arg.split('=')
            f[k] = v
        return f


request = Request()


def error(request, code=404):
    error_dict = {
        404: b'HTTP/1.1 404 NOT FOUND\r\n\r\n</h1>404 NOT FOUND</h1>',
    }
    return error_dict.get(code, b'')


def response_for_path(path):
    r = {
        #  if path = '/' then return route_index
        '/': route_index,
    }
    r.update(route_dict)
    response = r.get(path, error)
    return response(request)


def run(host='', port=3000):
    # s = socket.socket()
    with socket.socket() as s:
        s.bind((host, port))
        while True:
            # use listen to monitor requirements
            s.listen(3)
            connection, address = s.accept()
            # r = receive the data that user to give
            r = connection.recv(1024)
            # transfer bytes to str
            r = r.decode('utf-8')
            print('r what the data that requires looks like', r)
            # avoid null requirement
            if len(r.split()) < 2:
                continue
            request.method = r.split()[0]
            request.body = r.split('\r\n\r\n')[1]
            path = r.split()[1]
            request.path = path
            response = response_for_path(path)
            connection.sendall(response)
            connection.close()


run('', 3000)
