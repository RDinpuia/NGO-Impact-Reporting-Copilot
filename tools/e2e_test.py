import json, urllib.request, sys, os
url='http://127.0.0.1:8000'

def login(email, password):
    data = json.dumps({'email':email,'password':password}).encode()
    req = urllib.request.Request(url + '/api/auth/login', data=data, headers={'Content-Type':'application/json'})
    resp = urllib.request.urlopen(req)
    return json.loads(resp.read().decode())


def upload_file(token, path):
    import mimetypes
    boundary = '----WebKitFormBoundary7MA4YWxkTrZu0gW'
    data = []
    filename = os.path.basename(path)
    with open(path,'rb') as f:
        filedata = f.read()
    data.append(bytes('--' + boundary + '\r\n', 'utf-8'))
    data.append(bytes(f'Content-Disposition: form-data; name="file"; filename="{filename}"\r\n', 'utf-8'))
    data.append(bytes('Content-Type: application/octet-stream\r\n\r\n', 'utf-8'))
    data.append(filedata)
    data.append(bytes(f'\r\n--{boundary}--\r\n', 'utf-8'))
    body = b''.join(data)
    req = urllib.request.Request(url + '/api/uploads/', data=body, headers={'Content-Type': f'multipart/form-data; boundary={boundary}', 'Authorization': f'Bearer {token}'})
    resp = urllib.request.urlopen(req)
    return json.loads(resp.read().decode())


def generate_report(token, upload_id, tone='formal', title='E2E Test Report'):
    data = json.dumps({'upload_id': upload_id, 'tone': tone, 'title': title}).encode()
    req = urllib.request.Request(url + '/api/reports/generate', data=data, headers={'Content-Type':'application/json', 'Authorization': f'Bearer {token}'})
    resp = urllib.request.urlopen(req)
    return json.loads(resp.read().decode())


def download_pdf(token, report_id, out_path):
    req = urllib.request.Request(url + f'/api/reports/{report_id}/pdf', headers={'Authorization': f'Bearer {token}'})
    resp = urllib.request.urlopen(req)
    ct = resp.getheader('Content-Type')
    print('content-type', ct)
    data = resp.read()
    with open(out_path, 'wb') as f:
        f.write(data)
    return out_path


if __name__ == '__main__':
    try:
        print('Logging in...')
        login_resp = login('demo@impactlens.org','demo1234')
        token = login_resp['access_token']
        print('Logged in, token len', len(token))

        # upload sample file from seed
        sample = os.path.join(os.path.dirname(__file__), '..', 'backend', 'app', 'seed', 'sample_data.csv')
        print('Uploading sample file', sample)
        up = upload_file(token, sample)
        print('Upload result id', up['id'])

        report = generate_report(token, up['id'], tone='formal', title='E2E Generated')
        print('Generated report id', report['id'], 'status', report.get('status'))

        out = os.path.join(os.path.dirname(__file__), 'e2e_report.pdf')
        print('Downloading PDF to', out)
        download_pdf(token, report['id'], out)
        print('PDF saved')
        print('E2E flow completed successfully')
    except Exception as e:
        print('E2E failure', e)
        sys.exit(1)
