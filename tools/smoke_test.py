import urllib.request, json, sys
url='http://127.0.0.1:8000'

def get(path):
    try:
        return json.loads(urllib.request.urlopen(url+path).read().decode())
    except Exception as e:
        print('ERROR GET', path, e)
        return None

print('health ->', get('/api/health'))

# login
data = json.dumps({'email':'demo@impactlens.org','password':'demo1234'}).encode()
req = urllib.request.Request(url + '/api/auth/login', data=data, headers={'Content-Type':'application/json'})
try:
    resp = urllib.request.urlopen(req)
    login = json.loads(resp.read().decode())
    print('login ->', login)
except Exception as e:
    print('login failed', e)
    sys.exit(1)

token = login.get('access_token')
if not token:
    print('no token returned')
    sys.exit(1)

# me
req = urllib.request.Request(url + '/api/auth/me', headers={'Authorization': f'Bearer {token}'})
print('me ->', json.loads(urllib.request.urlopen(req).read().decode()))

# dashboard
req = urllib.request.Request(url + '/api/dashboard/stats', headers={'Authorization': f'Bearer {token}'})
print('dashboard ->', json.loads(urllib.request.urlopen(req).read().decode()))

# list uploads
req = urllib.request.Request(url + '/api/uploads/', headers={'Authorization': f'Bearer {token}'})
print('uploads ->', json.loads(urllib.request.urlopen(req).read().decode()))

# list reports
req = urllib.request.Request(url + '/api/reports/', headers={'Authorization': f'Bearer {token}'})
print('reports ->', json.loads(urllib.request.urlopen(req).read().decode()))
