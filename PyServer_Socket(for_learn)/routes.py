from models import User


def template(name):
    path = 'templates/' + name
    with open(path, 'r', encoding='utf-8') as f:
        return f.read()


def route_index(request):
    header = 'HTTP/1.1 200 OK\r\nContent-type: text/html\r\n'
    body = template('index.html')
    r = header + '\r\n' + body
    return r.encode(encoding='utf-8')


def route_login(request):
    header = 'HTTP/1.1 200 OK\r\nContent-type: text/html\r\n'
    if request.method == 'POST':
        form = request.form()
        u = User(form)
        # check login
        if u.validate_register():
            result = 'login successfully!'
        else:
            result = 'login error!wrong username or password'
    else:
        result = ''
    body = template('login.html')
    body = body.replace('{{result}}', result)
    r = header + '\r\n' + body
    return r.encode(encoding='utf-8')


def route_register(request):
    header = 'HTTP/1.1 200 OK\r\nContent-type: text/html\r\n'
    if request.method == 'POST':
        form = request.form()
        u = User(form)
        if u.validate_register():
            u.save()
            result = 'register successfully!'
        else:
            result = 'register error! check your username or password length'
    else:
        result = ''
    body = template('register.html')
    body = body.replace('{{result}}', result)
    r = header + '\r\n' + body
    return r.encode(encoding='utf-8')


route_dict = {
    '/login': route_login,
    '/register': route_register,
}
