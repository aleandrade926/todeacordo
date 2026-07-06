f='andrade-florio-scraper/minerador.py'
c=open(f,'r',encoding='utf-8').read()
c=c.replace('termos = ["incorporadora", "construtora", "indústria metalúrgica", "agronegócio", "logística", "química", "holding"]', 'termos = ["indústria", "agronegócio", "construtora", "incorporadora", "logística", "química", "varejo", "tecnologia", "energia", "atacadista", "holding", "farmacêutica"]')
open(f,'w',encoding='utf-8').write(c)
