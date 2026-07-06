import re

with open('painel.py', 'r', encoding='utf-8') as f:
    content = f.read()

# Find the bookmarklet install section
start_marker = '        <!-- Bookmarklet Help Section -->'
end_marker = '        </div>\n\n        <!-- Frutas Baixas Section'

idx_start = content.find(start_marker)
idx_end = content.find(end_marker)

if idx_start == -1:
    print("ERROR: Could not find start marker")
    exit(1)
if idx_end == -1:
    print("ERROR: Could not find end marker")
    # Try alternate end marker
    end_marker2 = '        </div>\r\n\r\n        <!-- Frutas Baixas Section'
    idx_end = content.find(end_marker2)
    if idx_end == -1:
        # Just find the next div after bookmarklet
        idx_end = content.find('<!-- Frutas Baixas Section', idx_start)
        if idx_end != -1:
            # go back to find the closing div before it
            idx_end = content.rfind('</div>', idx_start, idx_end) + len('</div>')
        else:
            print("ERROR: Can't find end, aborting")
            exit(1)
    else:
        idx_end = idx_end  # keep the end marker in result
else:
    idx_end = idx_end  # keep the end marker in result

print(f"Found section from {idx_start} to {idx_end}")
print("--- OLD SECTION START ---")
print(content[idx_start:idx_start+200])
print("--- OLD SECTION END ---")

new_section = r"""        <!-- Bookmarklet Help Section -->
        <div id="bookmarkletInstallSection" style="background: var(--bg-card); border: 1px solid var(--border-color); border-radius: 8px; padding: 16px; margin-bottom: 24px;">
            <h3 style="margin-top: 0; color: var(--accent-purple);">&#128279; Instalar Bot&#227;o de Captura do LinkedIn</h3>
            <p style="font-size: 0.9em; margin-bottom: 12px; color: var(--text-secondary);">
                <strong>Como instalar:</strong><br>
                1&#176; Clique em <strong>&#128203; Copiar C&#243;digo</strong> abaixo.<br>
                2&#176; No Chrome: aperte <strong>Ctrl+Shift+O</strong> &rarr; clique em &ldquo;+ Adicionar&rdquo; &rarr; cole o c&#243;digo no campo <strong>URL</strong>.<br>
                3&#176; Use o favorito quando estiver no perfil de um lead no LinkedIn.
            </p>
            <div style="display:flex; gap:10px; align-items:center; flex-wrap:wrap; margin-bottom:8px;">
                <span id="bookmarkletAnchorWrap">
                    <a id="bookmarkletDragBtn" href="#" style="display:inline-block; background:var(--accent-purple); color:#fff; padding:8px 16px; border-radius:6px; font-weight:bold; text-decoration:none; cursor:grab;" title="Arraste para a barra de favoritos">
                        &#128640; Capturar Lead (Arraste para Favoritos)
                    </a>
                </span>
                <button onclick="copyBookmarkletCode()" style="background:var(--accent-blue); color:#fff; border:none; padding:8px 16px; border-radius:6px; font-weight:bold; cursor:pointer; font-size:0.9em;">
                    &#128203; Copiar C&#243;digo
                </button>
                <span id="bookmarkletCopyMsg" style="color:var(--accent-green); font-size:0.85em; display:none;">&#9989; Copiado! Cole no campo URL de um favorito novo.</span>
            </div>
            <script>
            (function() {
                var ORIGIN = window.location.origin;
                var js = '(function(){try{'
                  + 'var nameNode=document.querySelector("h1.text-heading-xlarge")||document.querySelector(".pv-text-details__left-panel h1")||document.querySelector(".text-heading-xlarge")||document.querySelector("main h1")||document.querySelector("h1");'
                  + 'var name=nameNode?nameNode.innerText.trim():"";'
                  + 'if(!name||name.length<2){var h1s=Array.from(document.querySelectorAll("h1"));var v=h1s.find(function(h){return h.innerText.trim().length>1;});if(v)name=v.innerText.trim();}'
                  + 'var roleNode=document.querySelector(".pv-text-details__left-panel .text-body-medium")||document.querySelector(".text-body-medium.break-words")||document.querySelector("main .text-body-medium")||document.querySelector(".text-body-medium");'
                  + 'var rawRole=roleNode?roleNode.innerText.trim():"";'
                  + 'if(!rawRole){var hn=document.querySelector("[data-field=\\"headline\\"]");if(hn)rawRole=hn.innerText.trim();}'
                  + 'var role=rawRole,company="";'
                  + 'if(rawRole.indexOf(" at ")>-1){var p=rawRole.split(" at ");role=p[0].trim();company=p[1].trim();}'
                  + 'else if(rawRole.indexOf(" na ")>-1){var p=rawRole.split(" na ");role=p[0].trim();company=p[1].trim();}'
                  + 'else if(rawRole.indexOf(" no ")>-1){var p=rawRole.split(" no ");role=p[0].trim();company=p[1].trim();}'
                  + 'else if(rawRole.indexOf(" em ")>-1){var p=rawRole.split(" em ");role=p[0].trim();company=p[1].trim();}'
                  + 'if(!name){name=prompt("Digite o nome do lead:");if(!name)return;name=name.trim();}'
                  + 'if(!role){var uc=prompt("Digite cargo e empresa (ex: CFO na Empresa X):");if(uc){rawRole=uc.trim();role=rawRole;if(rawRole.indexOf(" na ")>-1){var p=rawRole.split(" na ");role=p[0].trim();company=p[1].trim();}}}'
                  + 'var url=window.location.href;'
                  + 'var email="";var emailNode=Array.from(document.querySelectorAll("a")).filter(function(a){return a.href.indexOf("mailto:")===0;})[0];if(emailNode)email=emailNode.href.replace("mailto:","").trim();'
                  + 'var chatHistory="";var msgs=document.querySelectorAll(".msg-s-message-list__event,.msg-s-event-listitem");'
                  + 'if(msgs.length>0){chatHistory=Array.from(msgs).map(function(el){var sn=el.querySelector(".msg-s-message-group__name");var sender=sn?sn.innerText.trim():"Contato";var tn=el.querySelector(".msg-s-event-listitem__body");var text=tn?tn.innerText.trim():"";return text?sender+": "+text:"";}).filter(function(t){return t!=="";}).slice(-8).join("\\n");}'
                  + 'var inputStr=prompt("Capturado:\\n"+name+"\\n"+(company?role+" na "+company:role)+"\\n\\nAcao:\\n1-Importar\\n2-Curtiu Artigo\\n3-Newsletter\\n4-Respondeu Chat\\n5-Aceitou Conexao\\n\\nOu cole a conversa:","1");'
                  + 'if(!inputStr)return;inputStr=inputStr.trim();'
                  + 'var action="Importado";'
                  + 'if(inputStr==="1")action="Importado";'
                  + 'else if(inputStr==="2")action="Curtiu Artigo";'
                  + 'else if(inputStr==="3")action="Assinou Newsletter";'
                  + 'else if(inputStr==="4")action="Respondeu Chat";'
                  + 'else if(inputStr==="5")action="Aceitou Conexao";'
                  + 'else if(inputStr.length>5){action="Respondeu Chat";chatHistory=inputStr;if(chatHistory.length>10000){chatHistory=chatHistory.substring(chatHistory.length-10000);}}'
                  + 'var importUrl="' + ORIGIN + '/api/import_page?name="+encodeURIComponent(name)+"&role="+encodeURIComponent(role)+"&company="+encodeURIComponent(company)+"&url="+encodeURIComponent(url)+"&action="+encodeURIComponent(action)+"&email="+encodeURIComponent(email)+"&chat_history="+encodeURIComponent(chatHistory);'
                  + 'window.open(importUrl,"_blank","width=500,height=400");'
                  + '}catch(e){alert("Erro no bookmarklet: "+e);}})();';
                var fullCode = 'javascript:' + js;
                window._bookmarkletCode = fullCode;
                var a = document.getElementById('bookmarkletDragBtn');
                if(a) a.href = fullCode;
            })();
            function copyBookmarkletCode() {
                if(!window._bookmarkletCode){ alert('Codigo nao gerado, recarregue a pagina.'); return; }
                if(navigator.clipboard && navigator.clipboard.writeText) {
                    navigator.clipboard.writeText(window._bookmarkletCode).then(function(){
                        var m = document.getElementById('bookmarkletCopyMsg');
                        if(m){ m.style.display='inline'; setTimeout(function(){ m.style.display='none'; }, 5000); }
                    }).catch(function(){
                        prompt('Copie tudo abaixo (Ctrl+A, Ctrl+C):', window._bookmarkletCode);
                    });
                } else {
                    prompt('Copie tudo abaixo (Ctrl+A, Ctrl+C):', window._bookmarkletCode);
                }
            }
            </script>
        </div>

"""

new_content = content[:idx_start] + new_section + content[idx_end:]
print(f"Content changed: {len(content)} -> {len(new_content)} chars")

with open('painel.py', 'w', encoding='utf-8') as f:
    f.write(new_content)

print("SUCCESS: bookmarklet section replaced!")
