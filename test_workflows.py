import base64, json, sqlite3, tempfile, threading, unittest, urllib.request, urllib.error
from io import BytesIO
from pathlib import Path
from unittest.mock import patch
from http.server import ThreadingHTTPServer
from pptx import Presentation
from reportlab.pdfgen import canvas
import server

class Workflows(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.tmp=tempfile.TemporaryDirectory(); cls.previous=server.DB; server.DB=Path(cls.tmp.name)/'test.sqlite'
        with sqlite3.connect(cls.previous, factory=server.ClosingConnection) as src, sqlite3.connect(server.DB, factory=server.ClosingConnection) as dst:
            for row in src.execute("SELECT sql FROM sqlite_master WHERE type='table' AND sql IS NOT NULL"):
                dst.execute(row[0])
        cls.http=ThreadingHTTPServer(('127.0.0.1',0),server.Handler); cls.port=cls.http.server_port
        cls.thread=threading.Thread(target=cls.http.serve_forever,daemon=True); cls.thread.start()
    @classmethod
    def tearDownClass(cls):
        cls.http.shutdown();cls.http.server_close();server.DB=cls.previous;cls.tmp.cleanup()
    def post(self,path,data):
        req=urllib.request.Request(f'http://127.0.0.1:{self.port}/api/{path}',data=json.dumps(data).encode(),headers={'Content-Type':'application/json'})
        with urllib.request.urlopen(req) as r: return json.load(r)
    def test_full_flow(self):
        ppt=Presentation();slide=ppt.slides.add_slide(ppt.slide_layouts[1]);slide.shapes.title.text='Test lesson';slide.placeholders[1].text='A CPU executes instructions.';p=BytesIO();ppt.save(p)
        pdf=BytesIO();cv=canvas.Canvas(pdf);cv.drawString(50,750,'Memory stores data temporarily for a computer.');cv.save()
        for name,raw in [('Module 91.pptx',p.getvalue()),('Module 92.pdf',pdf.getvalue())]:
            body={'name':name,'data':base64.b64encode(raw).decode()};self.assertEqual(self.post('upload',body)['status'],'imported');self.assertEqual(self.post('upload',body)['status'],'duplicate')
        mods=server.modules();self.assertEqual(len(mods),2);self.assertIn('CPU executes instructions',mods[0]['content'])
        fake={'questions':[{'topic':'Hardware','difficulty':'Easy','questionText':'What executes instructions?','options':['CPU','RAM','Monitor','Disk'],'correctIndex':0,'explanation':'The CPU executes instructions.','sourceReference':'Slide 1'}]}
        with patch.object(server,'ai',return_value=fake): q=self.post('quiz',{'ids':[mods[0]['id']],'count':10})['questions'][0]
        self.assertEqual(len(q['options']),4);self.assertEqual(q['options'][q['correctIndex']],'CPU');self.assertTrue(q['explanation'])
        with patch.object(server,'ai',return_value=fake): self.assertEqual(self.post('quiz',{'ids':[mods[0]['id']],'count':10})['questions'],[])
        guide={'sections':[{'title':'Overview','content':'A CPU executes instructions.'}]}
        with patch.object(server,'ai',return_value=guide): self.assertEqual(self.post('reviewer',{'id':mods[0]['id'],'mode':'standard'}),guide)
        self.assertEqual(self.post('reviewer',{'id':mods[0]['id'],'mode':'standard'}),guide)
        attempt={'id':'test-attempt','started':1,'finished':2,'answers':[{'question':q,'selected':q['correctIndex'],'correct':True}]};self.assertTrue(self.post('attempt',attempt)['ok'])
        with urllib.request.urlopen(f'http://127.0.0.1:{self.port}/api/state') as r: state=json.load(r)
        self.assertEqual(len(state['attempts']),1);self.assertEqual(state['questionCount'],1)
        mods[0]['completed']=1;self.post('module',mods[0]);self.assertEqual(server.modules()[0]['completed'],1)
        self.assertTrue(server.similar('What executes instructions?', 'What executes instructions!'))

if __name__=='__main__': unittest.main()
