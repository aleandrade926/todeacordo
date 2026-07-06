console.log("[TaxManagers] CLIQUE RECEBIDO v1.0.19");

(async function() {
  const now = Date.now();
  if (window.__tmLastCapture && (now - window.__tmLastCapture) < 8000) {
    console.log("[TaxManagers] Captura já em andamento, ignorando clique duplicado.");
    return;
  }
  window.__tmLastCapture = now;

  let name = '', headline = '', company = '', role = '';
  let email = '', phone = '', birthday = '';
  let autoChatHistory = '';
  let promptOpened = false;
  let willNavigate = false;
  
  const cleanUrl = window.location.origin + window.location.pathname.replace(/\/$/, '');

  function openFinalPrompt() {
    if (promptOpened) return;
    promptOpened = true;
    
    sessionStorage.removeItem("tm_capture_pending");
    sessionStorage.removeItem("tm_name");
    sessionStorage.removeItem("tm_headline");
    sessionStorage.removeItem("tm_company");
    sessionStorage.removeItem("tm_role");

    let promptMsg = 'Revisão de Mapeamento Tributário:\n\n';
    promptMsg += 'Nome: ' + (name || '') + '\n';
    promptMsg += 'Cargo: ' + (role || '') + '\n';
    promptMsg += 'Empresa: ' + (company || '') + '\n';
    promptMsg += 'Email: ' + (email || '') + '\n';
    promptMsg += 'Telefone: ' + (phone || '') + '\n';
    promptMsg += 'Aniversário: ' + (birthday || '') + '\n\n';
    promptMsg += 'Ação:\n1 = Mapear Oportunidade\n2 = Curtiu\n3 = News\n4 = Chat\n5 = Conexão aceita - outbound\n6 = Pediu conexão - inbound\n\n';
    promptMsg += 'Para ajustar dados antes, use o formato:\n';
    promptMsg += 'Cargo na Empresa | Email | Telefone\n';
    promptMsg += 'Ou cole a CONVERSA do chat:';

    let defaultAct = '1';
    const txtContent = document.body.innerText || '';
    if (window.location.href.includes('/mynetwork/grow/') || 
        txtContent.includes('gostaria de se conectar') || 
        txtContent.includes('Convites') || 
        txtContent.includes('Aceitar')) {
      defaultAct = '6';
    }

    let inst = prompt(promptMsg, defaultAct);
    if (!inst) { 
      window.__tmLastCapture = 0; 
      return; 
    }
    inst = inst.trim();

    let act = 'Importado';
    if      (inst === '1') act = 'Importado';
    else if (inst === '2') act = 'Curtiu Artigo';
    else if (inst === '3') act = 'Assinou Newsletter';
    else if (inst === '4') act = 'Respondeu Chat';
    else if (inst === '5') act = 'Aceitou Conexão (Outbound)';
    else if (inst === '6') act = 'Pediu Conexão (Inbound)';
    else if (inst.includes('|')) {
      const parts = inst.split('|').map(p => p.trim());
      if (parts[0] && parts[0].length > 0) {
        const roleComp = parts[0];
        let foundSep = false;
        for (const sep of [' na ', ' at ', ' no ', ' em ', ' - ']) {
          if (roleComp.includes(sep)) {
            const rp = roleComp.split(sep);
            role = rp[0].trim();
            company = rp.slice(1).join(sep).trim();
            foundSep = true;
            break;
          }
        }
        if (!foundSep) {
          role = roleComp; // Updates role only, keeps existing company if not specified
        }
      }
      if (parts.length > 1 && parts[1]) email = parts[1];
      if (parts.length > 2 && parts[2]) phone = parts[2];
      act = 'Importado';
    } else if (inst.includes(' na ') || inst.includes(' at ') || inst.includes(' @ ')) {
      const roleComp = inst;
      let foundSep = false;
      for (const sep of [' na ', ' at ', ' no ', ' em ', ' - ']) {
        if (roleComp.includes(sep)) {
          const rp = roleComp.split(sep);
          role = rp[0].trim();
          company = rp.slice(1).join(sep).trim();
          foundSep = true;
          break;
        }
      }
      if (!foundSep) {
        role = roleComp;
      }
      act = 'Importado';
    } else if (inst.length > 5) {
      act = 'Respondeu Chat';
      let ch = inst;
      if (autoChatHistory) ch = autoChatHistory.trim() + "\n\n" + ch;
      if (ch.length > 10000) ch = ch.substring(ch.length - 10000);
      
      const targetOrigin = 'https://app.taxmanagers.com.br';
      const iu = targetOrigin + '/taxmanagers/app/import'
        + '?name='    + encodeURIComponent(name)
        + '&role='    + encodeURIComponent(role)
        + '&company=' + encodeURIComponent(company)
        + '&url='     + encodeURIComponent(cleanUrl)
        + '&action='  + encodeURIComponent(act);

      console.log("[TaxManagers] Abrindo janela de importação...");
      const popup = window.open(iu, '_blank', 'width=420,height=340');
      if (!popup) {
        alert('Popup bloqueado! Permita popups para o LinkedIn nas configurações do Chrome.');
        window.__tmLastCapture = 0;
        return;
      }

      window.addEventListener('message', function handler(event) {
        if (event.source === popup && event.data === 'ready') {
          popup.postMessage({
            type:         'lead_data',
            name:         name,
            role:         role,
            company:      company,
            url:          cleanUrl,
            action:       act,
            email:        email,
            phone:        phone,
            birthday:     birthday,
            chat_history: ch
          }, targetOrigin);
          window.removeEventListener('message', handler);
          setTimeout(() => { window.__tmLastCapture = 0; }, 3000);
        }
      });
      return;
    }

    const targetOrigin = 'https://app.taxmanagers.com.br';
    const iu = targetOrigin + '/taxmanagers/app/import'
      + '?name='    + encodeURIComponent(name)
      + '&role='    + encodeURIComponent(role)
      + '&company=' + encodeURIComponent(company)
      + '&url='     + encodeURIComponent(cleanUrl)
      + '&action='  + encodeURIComponent(act);

    console.log("[TaxManagers] Abrindo janela de importação...");
    const popup = window.open(iu, '_blank', 'width=420,height=340');
    if (!popup) {
      alert('Popup bloqueado! Permita popups para o LinkedIn nas configurações do Chrome.');
      window.__tmLastCapture = 0;
      return;
    }

    window.addEventListener('message', function handler(event) {
      if (event.source === popup && event.data === 'ready') {
        console.log("[TaxManagers] Handshake realizado. Enviando dados do lead para a janela...");
        popup.postMessage({
          type:         'lead_data',
          name:         name,
          role:         role,
          company:      company,
          url:          cleanUrl,
          action:       act,
          email:        email,
          phone:        phone,
          birthday:     birthday,
          chat_history: autoChatHistory.trim()
        }, targetOrigin);
        window.removeEventListener('message', handler);
        setTimeout(() => { window.__tmLastCapture = 0; }, 3000);
      }
    });
  }

  const mainFlow = async () => {
    function cleanName(rawName) {
      if (!rawName) return '';
      let name = rawName;
      try {
        name = name.replace(/\p{Emoji_Presentation}/gu, '');
        name = name.replace(/\p{Extended_Pictographic}/gu, '');
        name = name.replace(/\p{Symbol}/gu, '');
      } catch (e) {
        name = name.replace(/[\u2700-\u27BF]|[\uE000-\uF8FF]|\uD83C[\uDC00-\uDFFF]|\uD83D[\uDC00-\uDFFF]|[\u2011-\u26FF]|\uD83E[\uDD10-\uDDFF]/g, '');
      }
      name = name.replace(/^[^a-zA-Z0-9À-ÿ\s]+/gu, '');
      name = name.replace(/[^a-zA-Z0-9À-ÿ\s]+$/gu, '');
      name = name.replace(/\s+/g, ' ').trim();
      return name;
    }

    let invMsg = '';
    const invMsgEl = document.querySelector('.invitation-card__message, .msg-s-event-listitem__message-bubble, .msg-overlay-conversation-bubble__message-snippet');
    if (invMsgEl) invMsg = invMsgEl.innerText.trim();

    let mutual = '';
    const mutualEl = Array.from(document.querySelectorAll('span, button, div')).find(el => {
      const t = el.innerText || '';
      return (t.toLowerCase().includes('conexões em comum') || t.toLowerCase().includes('mutual connection')) && t.length < 50;
    });
    if (mutualEl) {
      const m = mutualEl.innerText.match(/\d+/);
      if (m) mutual = m[0] + ' conexões em comum';
    }

    if (invMsg) autoChatHistory += "Mensagem do convite: " + invMsg + "\n";
    if (mutual) autoChatHistory += mutual + "\n";

    const isPending = sessionStorage.getItem("tm_capture_pending") === "1";
    
    if (isPending) {
      console.log("[TaxManagers] Retomando captura pendente do sessionStorage...");
      name = sessionStorage.getItem("tm_name") || '';
      headline = sessionStorage.getItem("tm_headline") || '';
      company = sessionStorage.getItem("tm_company") || '';
      role = sessionStorage.getItem("tm_role") || '';
    } else {
      console.log("[TaxManagers] etapa 2: perfil lido");
      
      let rawName = '';
      const nameSelectors = [
        'h1.text-heading-xlarge',
        '.pv-text-details__left-panel h1',
        'main h1.break-words',
        '.profile-info-subheader h1',
        'h1'
      ];
      for (const sel of nameSelectors) {
        const el = document.querySelector(sel);
        if (el && el.innerText.trim().length > 1) { 
          rawName = el.innerText.trim(); 
          break; 
        }
      }
      if (!rawName) {
        const h1s = Array.from(document.querySelectorAll('h1'));
        const vh1 = h1s.find(h => h.innerText.trim().length > 1);
        if (vh1) rawName = vh1.innerText.trim();
      }
      if (!rawName) rawName = document.title.split('-')[0].split('|')[0].trim();
      
      name = cleanName(rawName);
      console.log("[TaxManagers] Nome capturado (limpo):", name);

      const headlineSelectors = [
        '.text-body-medium[data-field="headline"]',
        'div.text-body-medium.break-words',
        '.pv-text-details__left-panel .text-body-medium',
        '[data-field="headline"]',
        '.ph5 .text-body-medium',
        'main .text-body-medium',
        '.text-body-medium',
        'h2.text-body-medium'
      ];
      for (const sel of headlineSelectors) {
        const el = document.querySelector(sel);
        if (el && el.innerText.trim().length > 1) { 
          headline = el.innerText.trim(); 
          break; 
        }
      }
      if (!headline) {
        const el = Array.from(document.querySelectorAll('div, span, p')).find(e => {
          const cls = e.className || '';
          return typeof cls === 'string' && cls.includes('text-body-medium') && e.innerText.trim().length > 5;
        });
        if (el) headline = el.innerText.trim();
      }

      if (!headline) {
        // Se ainda não encontrou headline, procura elementos abaixo do h1
        const h1 = document.querySelector('h1');
        if (h1) {
          const parent = h1.parentElement;
          if (parent) {
            const nextDiv = parent.querySelector('div.text-body-medium, .text-body-medium, h2');
            if (nextDiv && nextDiv !== h1) {
              headline = nextDiv.innerText.trim();
            }
          }
        }
      }

      function isInvalidCompany(c) {
        if (!c) return true;
        const cl = c.toLowerCase().trim();
        if (cl.length < 2) return true;
        if (cl === name.toLowerCase().trim()) return true;
        if (headline && cl === headline.toLowerCase().trim()) return true;
        if (/^(mais|more|ver mais|show more|outros|others|mais\s\d+|ver\s.*)$/.test(cl)) return true;
        if (/general counsel|legal executive|head of legal|clo|ceo|cto|cfo|director|manager|lawyer/i.test(cl)) return true;
        if (/ensino|school|universidade|university|faculdade|college/i.test(cl)) return true;
        if (/conexão|conexões|connection|connections|seguidor|seguidores|visualizar|mensagem|informações de contato|contact info/i.test(cl)) return true;
        if (/miami|florida|estados unidos|united states|brasil|brazil|são paulo|rio de janeiro/i.test(cl)) return true;
        return false;
      }

      // 0. Procura em todos os links de empresa (/company/) da página (cabeçalho/DOM principal)
      try {
        if (!company) {
          const companyLinks = Array.from(document.querySelectorAll('a[href*="/company/"]'));
          for (const link of companyLinks) {
            const cText = link.innerText ? link.innerText.split('\n')[0].trim() : '';
            if (cText && !isInvalidCompany(cText)) {
              company = cText;
              break;
            }
          }
        }
      } catch (err) {
        console.warn("[TaxManagers] Erro no mapeador de links de empresa:", err);
      }

      // 1. Right Panel / Top Card
      const rightPanelSelectors = [
        '.pv-text-details__right-panel',
        '[data-estimated-current-company="true"]',
        '[data-field="experience_member_company_single_line"]',
        '.pv-text-details__right-panel-item'
      ];
      
      for (const selector of rightPanelSelectors) {
        const rightPanel = document.querySelector(selector);
        if (rightPanel) {
          const items = Array.from(rightPanel.querySelectorAll('button, a, li, span, div'))
            .map(el => el.innerText.trim())
            .filter(t => t.length > 2);
          
          for (const item of items) {
            const c = item.replace(/\n.*/, '').trim();
            if (!isInvalidCompany(c)) {
              company = c;
              break;
            }
          }
          if (company) break;
        }
      }

      // 2. Fallback no texto do corpo próximo ao headline
      if (!company && headline) {
        const bodyText = document.body.innerText;
        const lines = bodyText.split('\n').map(l => l.trim()).filter(l => l.length > 0);
        const hlIndex = lines.findIndex(l => l.includes(headline) || headline.includes(l));
        
        if (hlIndex !== -1) {
          for (let i = hlIndex + 1; i < Math.min(hlIndex + 10, lines.length); i++) {
            const line = lines[i];
            if (!isInvalidCompany(line)) {
              company = line;
              break;
            }
          }
        } else {
           const nameIndex = lines.findIndex(l => l.toLowerCase().includes(name.toLowerCase()));
           if (nameIndex !== -1) {
             for (let i = nameIndex + 2; i < Math.min(nameIndex + 10, lines.length); i++) {
               const line = lines[i];
               if (!isInvalidCompany(line)) {
                 company = line;
                 break;
               }
             }
           }
        }
      }

      // Captura de cargo e empresa da seção de Experiência
      let scrapedRole = '';
      let scrapedCompany = '';
      let expSection = document.querySelector('section#experience, section[data-section="experience"], #experience-section, [id*="experience"]');
      if (!expSection) {
        const headings = Array.from(document.querySelectorAll('h2, h3, span'));
        const expHeading = headings.find(h => {
          const txt = h.innerText.trim().toLowerCase();
          return txt === 'experiência' || txt === 'experience' || txt === 'experiencia';
        });
        if (expHeading) {
          expSection = expHeading.closest('section') || expHeading.parentElement;
        }
      }

      if (expSection) {
        const firstLi = expSection.querySelector('li');
        if (firstLi) {
          const hasSubList = firstLi.querySelector('ul');
          const spans = Array.from(firstLi.querySelectorAll('span[aria-hidden="true"]'))
            .map(el => el.innerText.trim())
            .filter(t => t.length > 0);

          if (hasSubList) {
            // Com sublista: spans[0] é a Empresa
            if (spans.length > 0) scrapedCompany = spans[0];
            
            const subSpans = Array.from(firstLi.querySelector('ul li').querySelectorAll('span[aria-hidden="true"]'))
              .map(el => el.innerText.trim())
              .filter(t => t.length > 0);
            if (subSpans.length > 0) scrapedRole = subSpans[0];
          } else {
            // Sem sublista: spans[0] é o Cargo, spans[1] é a Empresa
            if (spans.length > 0) scrapedRole = spans[0];
            if (spans.length > 1) {
              // Limpar sufixos comuns de tempo ou jornada (ex: " · Full-time")
              scrapedCompany = spans[1].split('·')[0].split('•')[0].trim();
            }
          }
        }
      }

      role = scrapedRole || headline;
      if (!company && scrapedCompany && !isInvalidCompany(scrapedCompany)) {
        company = scrapedCompany;
      }

      const separators = [' at ', ' na ', ' no ', ' em ', ' @ '];
      if (!company && headline) {
        for (const sep of separators) {
          if (headline.includes(sep)) {
            const parts = headline.split(sep);
            const candidate = parts.slice(1).join(sep).trim();
            if (!isInvalidCompany(candidate)) {
               company = candidate;
               role = parts[0].trim();
               break;
            }
          }
        }
      }

      if (!role) {
        role = headline;
      }

      sessionStorage.setItem("tm_name", name);
      sessionStorage.setItem("tm_headline", headline);
      sessionStorage.setItem("tm_company", company);
      sessionStorage.setItem("tm_role", role);
    }

    console.log("[TaxManagers] etapa 3: link contato clicado (ou tentando)");

    function findContactLink() {
      const selectors = [
        'a[href*="/overlay/contact-info/"]',
        'a[href*="/overlay/contact-info"]',
        'a[href*="/contact-info"]',
        '#topcard-cog-contact-info',
        '[data-control-name="contact_profile"]',
        '.contact-info-link'
      ];
      for (const selector of selectors) {
        const el = document.querySelector(selector);
        if (el) return el;
      }

      const all = Array.from(document.querySelectorAll('a, button, [role="button"], span'));
      return all.find(el => {
        const text = el.innerText ? el.innerText.trim().toLowerCase() : '';
        return text.includes('informações de contato') || 
               text.includes('dados de contato') || 
               text.includes('contact info') || 
               text.includes('contact-info') ||
               text === 'contato' || 
               text === 'contact';
      });
    }

    function extractContactInfo(root) {
      let em = '', ph = '', bd = '';
      const textContent = root.innerText || "";
      const lines = textContent.split('\n').map(l => l.trim()).filter(l => l.length > 0);

      const mailLink = root.querySelector('a[href^="mailto:"]');
      if (mailLink) {
        em = mailLink.href.replace('mailto:', '').split('?')[0].trim();
      }
      if (!em) {
        const emailIdx = lines.findIndex(l => /^(e-mail|email)$/i.test(l));
        if (emailIdx !== -1 && emailIdx + 1 < lines.length) {
          const candidate = lines[emailIdx + 1];
          if (/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/.test(candidate)) {
            em = candidate;
          }
        }
      }
      if (!em) {
        const emailMatch = textContent.match(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/);
        if (emailMatch) {
          em = emailMatch[0];
        }
      }

      const telLink = root.querySelector('a[href^="tel:"]');
      if (telLink) {
        ph = telLink.href.replace('tel:', '').trim();
      }
      if (!ph) {
        const phoneIdx = lines.findIndex(l => /^(telefone|phone|celular|mobile)$/i.test(l));
        if (phoneIdx !== -1 && phoneIdx + 1 < lines.length) {
          ph = lines[phoneIdx + 1];
        }
      }
      if (!ph) {
        const phoneSec = root.querySelector('.ci-phone');
        if (phoneSec) {
          const lis = Array.from(phoneSec.querySelectorAll('li, span.t-14'));
          if (lis.length > 0) {
            ph = lis.map(li => li.innerText.trim()).filter(t => t.length > 2).join(' / ');
          } else {
            ph = phoneSec.innerText.replace(/telefone|celular|trabalho|phone|mobile|work/gi, '').trim().split('\n').filter(l => l.trim().length > 2).join(' / ');
          }
        }
      }
      if (!ph) {
        const allText = Array.from(root.querySelectorAll('span, li, a'))
          .map(el => el.innerText.trim())
          .filter(t => /^\+?[\d\s\-\(\)]{7,20}$/.test(t));
        if (allText.length > 0) {
          ph = allText[0];
        }
      }

      const bdayIdx = lines.findIndex(l => /^(aniversário|birthday|nascimento)$/i.test(l));
      if (bdayIdx !== -1 && bdayIdx + 1 < lines.length) {
        bd = lines[bdayIdx + 1];
      }
      if (!bd) {
        const bdaySec = root.querySelector('.ci-birthday');
        if (bdaySec) {
          bd = bdaySec.innerText.replace(/aniversário|birthday/gi, '').trim().split('\n').filter(l => l.trim().length > 1).join(' ');
        }
      }

      return { em: em.trim(), ph: ph.trim(), bd: bd.trim() };
    }

    function getContactModal() {
      const spec = document.querySelector('.pv-contact-info__modal, [class*="contact-info__modal"], #pv-contact-info');
      if (spec) return spec;
      
      const dialogs = Array.from(document.querySelectorAll('.artdeco-modal, [role="dialog"]'));
      return dialogs.find(d => {
        const txt = d.innerText ? d.innerText.toLowerCase() : '';
        if (txt.includes('mensagens') || txt.includes('messaging') || txt.includes('escreva uma mensagem') || txt.includes('chat')) return false;
        return txt.includes('dados de contato') || txt.includes('informações de contato') || txt.includes('contact info');
      });
    }

    const isOverlayUrl = window.location.pathname.includes('/overlay/contact-info');
    const existingModal = getContactModal();

    if (!isOverlayUrl && !existingModal) {
      const contactLink = findContactLink();
      if (contactLink) {
        console.log("[TaxManagers] Simulando clique no link de contato...");
        const clickable = contactLink.closest('a, button, [role="button"]') || contactLink;
        
        clickable.dispatchEvent(new MouseEvent('mousedown', { bubbles: true, cancelable: true, view: window }));
        clickable.dispatchEvent(new MouseEvent('mouseup', { bubbles: true, cancelable: true, view: window }));
        clickable.dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true, view: window }));
        if (typeof clickable.click === 'function') {
          clickable.click();
        }
        
        // Espera o modal carregar por até 3.5 segundos
        const modalStartTime = Date.now();
        let verifyModal = null;
        while (Date.now() - modalStartTime < 3500) {
          verifyModal = getContactModal();
          if (verifyModal) break;
          await new Promise(r => setTimeout(r, 100));
        }

        if (!verifyModal && !window.location.pathname.includes('/overlay/contact-info')) {
            const absUrl = cleanUrl + '/overlay/contact-info/';
            console.log("[TaxManagers] Navegando diretamente para o overlay do contato:", absUrl);
            sessionStorage.setItem("tm_capture_pending", "1");
            willNavigate = true;
            window.location.href = absUrl;
            throw new Error("NAVIGATING");
        }
      } else {
        const currentPath = window.location.pathname.replace(/\/$/, '');
        if (currentPath.startsWith('/in/')) {
          const contactUrl = window.location.origin + currentPath + '/overlay/contact-info/';
          console.log("[TaxManagers] Link não encontrado. Forçando navegação direta:", contactUrl);
          sessionStorage.setItem("tm_capture_pending", "1");
          willNavigate = true;
          window.location.href = contactUrl;
          throw new Error("NAVIGATING");
        }
      }
    }

    console.log("[TaxManagers] URL atual:", window.location.href);
    console.log("[TaxManagers] aguardando overlay renderizar...");
    
    await new Promise(r => setTimeout(r, 800));

    const startTime = Date.now();
    let loaded = false;
    while (Date.now() - startTime < 4500) {
      const txt = document.body.innerText || '';
      const hasEmailPattern = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/.test(txt);
      
      const hasContactHeader = txt.includes("Dados de contato") || txt.includes("Contact info") || txt.includes("contact-info");
      const hasEmailHeader = txt.includes("E-mail") || txt.includes("Email") || hasEmailPattern;
      
      if (hasContactHeader && hasEmailHeader) {
        loaded = true;
        break;
      }
      await new Promise(r => setTimeout(r, 100));
    }

    const previewTxt = document.body.innerText || '';
    console.log("[TaxManagers] body.innerText após espera:\n", previewTxt.substring(0, 400) + (previewTxt.length > 400 ? '...' : ''));

    const finalModal = getContactModal();
    const container = finalModal || document.body;

    const extracted = extractContactInfo(container);
    email = extracted.em;
    phone = extracted.ph;
    birthday = extracted.bd;

    console.log("[TaxManagers] email regex result:", email ? "Encontrado (" + email + ")" : "Não encontrado");

    if (finalModal) {
      try {
        await new Promise(r => setTimeout(r, 200));
        const closeBtn = document.querySelector('button.artdeco-modal__dismiss, [data-test-modal-close-btn], [aria-label="Descartar"], [aria-label="Dismiss"]');
        if (closeBtn) {
          closeBtn.click();
        } else {
          document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', code: 'Escape', keyCode: 27, which: 27, bubbles: true }));
        }
        await new Promise(r => setTimeout(r, 300));
      } catch(closeErr) {
        console.warn("[TaxManagers] Erro ao fechar modal:", closeErr);
      }
    }
  };

  const timeoutFlow = new Promise((resolve, reject) => {
    setTimeout(() => reject(new Error("TIMEOUT_7S")), 7000);
  });

  try {
    console.log("[TaxManagers] etapa 1: clique recebido");
    await Promise.race([mainFlow(), timeoutFlow]);
  } catch(err) {
    if (err.message === "NAVIGATING") {
      // Ignora, script vai recarregar na nova página
    } else if (err.message === "TIMEOUT_7S") {
      console.warn("[TaxManagers] timeout de 7 segundos atingido.");
      alert("TaxManagers: timeout diagnóstico, abrindo prompt final");
    } else {
      console.error("[TaxManagers] Erro capturado pelo try/catch global:", err);
      alert('TaxManagers erro: ' + err.message);
    }
  } finally {
    if (!willNavigate) {
      openFinalPrompt();
    }
  }

})();
