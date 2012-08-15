import requests
import json
import subprocess

class LineAPI(object):
    API_HOST = 'https://t.line.naver.jp'
    PROFILE_URL = API_HOST + '/rest/v1/profile'
    CONTACTS_URL = API_HOST + '/rest/v1/contacts'
    CONTACTS_SEARCH_URL = API_HOST + '/rest/v1/contacts/search'
    CHATS_URL = API_HOST + '/rest/v1/chats'
    GROUPS_URL = API_HOST + '/rest/v1/groups'
    RSA_KEY_URL = API_HOST + '/authct/v1/keys/line'

    def __init__(self, *args, **kwargs):
        cookies = kwargs.get('cookies_str')
        if cookies is None:
            email, password = kwargs.get('email'), kwargs.get('password')
            if email and password:
                #pass email and password to node.js and run app.js to get cookie
                p = subprocess.Popen(['node', 'app.js', email, password], stdout=subprocess.PIPE, stdin=subprocess.PIPE)
                stdout, sterr = p.communicate()
                headers = json.loads(stdout)
                cookies = headers.get('set-cookie')[0]

        if cookies:
            pairs = [pair.split('=') for pair in filter(lambda x: x!='', cookies.split(';'))]
            self.cookies = dict((pair[0], pair[1]) for pair in pairs)            

    def get_contacts(self):
        r = requests.get(self.__class__.CONTACTS_URL, cookies=self.cookies, params={
                         })

        return r.content

    def search_contacts_by_id(self, line_id):
        r = requests.get(self.__class__.CONTACTS_SEARCH_URL, cookies=self.cookies, params={
                         'id': line_id,
                         })

        return r.content

    def post_message_to_id(self, line_id, message='', sequenceNo=-1, mid='', contentType=0, sequence=0):
        url = '%s/%s/messages' % (self.__class__.CHATS_URL, line_id)
        r = requests.post(url, data={
                        'message': message,
                        'sequenceNo': sequenceNo,
                        'mid': mid,
                        'contentType': contentType,
                        'sequence': sequence,
                        }, cookies=self.cookies)

        return r.content

    def create_group_chat_with_ids(self, line_ids, chat_type=1):
        url = self.__class__.CHATS_URL
        r = requests.post(url, data={
                        'type': chat_type,
                        'ids': line_ids,
                        }, cookies=self.cookies)

        return r.content

    def create_group_with_ids(self, line_ids, name=''):
        url = self.__class__.GROUPS_URL
        r = requests.post(url, data={
                        'name': name,
                        'ids': line_ids,
                        }, cookies=self.cookies)

        return r.content





