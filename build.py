# Rebuilds the single-file app from the pieces in src/. Run: python3 build.py
import glob,os
here=os.path.dirname(os.path.abspath(__file__))
d=os.path.join(here,'src')+os.sep
import urllib.parse
# the Proview shell (same app-icon logo, sign-in page and loading page as the other Proview sites)
icon='"data:image/svg+xml,'+urllib.parse.quote(open(os.path.join(here,'icon-app.svg')).read(),safe="/:=;, ")+'"'
shell=open(d+'shell.css').read().replace('ICON',icon).replace('GRAD_A','#10B981').replace('GRAD_B','#047857')
out=open(d+'00-head.html').read()+open(d+'style.css').read()+shell+open(d+'01-body.html').read()
for f in sorted(glob.glob(d+'[0-9][0-9]-*.js')):
    out+='\n/* ---- '+os.path.basename(f)+' ---- */\n'+open(f).read()
out+='\n</script>\n</body>\n</html>\n'
import hashlib
ver=hashlib.sha1(out.encode()).hexdigest()[:12]
out=out.replace("const BUILD='__BUILD__'","const BUILD='"+ver+"'")
open(os.path.join(here,'index.html'),'w').write(out)
open(os.path.join(here,'version.txt'),'w').write(ver+'\n')
print(len(out),'bytes')
