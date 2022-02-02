import json


# write in txt
def save(data, path):
    s = json.dumps(data, indent=2, ensure_ascii=False)
    with open(path, 'w+', encoding='utf-8') as f:
        f.write(s)


def load(path):
    with open(path, 'r', encoding='utf-8') as f:
        s = f.read()
        return json.loads(s)


class Model(object):
    # to have the txt file name as same as the class
    @classmethod
    def db_path(cls):
        class_name = cls.__name__
        path = '{}.txt'.format(class_name)
        return path

    @classmethod
    def all(cls):
        path = cls.db_path()
        models = load(path)
        ms = [cls(m) for m in models]
        return ms

    # save in txt
    def save(self):
        models = self.all()
        models.append(self)
        l = [m.__dict__ for m in models]
        print('l', l)
        path = self.db_path()
        save(l, path)


class User(Model):
    def __init__(self, form):
        self.username = form.get('username', '')
        self.password = form.get('password', '')

    def validate_login(self):
        path = self.db_path()
        models = load(path)
        for i in models:
            if i['username'] == self.username and i['password'] == self.password:
                return True
        return False

    def validate_register(self):
        return len(self.username) > 2 and len(self.password) > 2
