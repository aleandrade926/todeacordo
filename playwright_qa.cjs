const { chromium } = require('playwright');

(async () => {
  console.log('--- Step 1: Open the application ---');
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext();
  const page = await context.newPage();

  try {
    await page.goto('http://localhost:5173/');
    await page.waitForLoadState('networkidle');
    console.log('Current URL:', page.url());
    await page.screenshot({ path: 'C:/Users/Alexandre/.gemini/antigravity/browser_recordings/01_opened_app.png' });

    // Dismiss language warning
    const dismissBtn = page.getByRole('button', { name: 'Entendi, continuar' });
    if (await dismissBtn.isVisible()) {
      await dismissBtn.click();
      console.log('Dismissed language warning banner.');
    }

    // 2. Click "+ Criar entendimento"
    console.log('--- Step 2: Pasting conversation ---');
    const createBtn = page.getByRole('button', { name: '+ Criar entendimento' });
    await createBtn.click();
    await page.waitForTimeout(500);

    const pasteBtn = page.getByRole('button', { name: 'Colar conversa' });
    await pasteBtn.click();
    await page.waitForTimeout(500);

    const textarea = page.locator('textarea[placeholder*="Ex:"]');
    const sampleTranscript = `[João]: Maria, preciso que me entregue a planilha financeira até sexta-feira às 18:00 para eu consolidar com a diretoria.
[Maria]: Tudo bem, João. Eu entrego na sexta-feira sem falta. Mas você precisa me mandar os extratos consolidados do banco até quarta-feira às 12:00.
[João]: Fechado! Vou te mandar os extratos na quarta de manhã. E se houver algum erro ou atraso nos extratos, te aviso para estender o prazo da planilha.
[Maria]: Beleza. Fico no aguardo dos extratos na quarta.`;

    await textarea.fill(sampleTranscript);
    await page.screenshot({ path: 'C:/Users/Alexandre/.gemini/antigravity/browser_recordings/02_pasted_transcript.png' });

    // 3. Generate understanding
    console.log('--- Step 3: Generating understanding ---');
    const generateBtn = page.getByRole('button', { name: 'Gerar com IA' });
    await generateBtn.click();

    console.log('Waiting for redirection to /meeting/...');
    await page.waitForURL(url => url.searchParams.get('route')?.includes('/meeting/'), { timeout: 20000 });
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(5000);
    await page.screenshot({ path: 'C:/Users/Alexandre/.gemini/antigravity/browser_recordings/03_understanding_page.png' });
    console.log('Current URL after generation:', page.url());

    // 4. Verify parts, summary, rules, details, etc.
    console.log('--- Step 4: Verification ---');
    const bodyText = await page.innerText('body');
    const expectedItems = ['Partes', 'Resumo', 'Obrigações', 'Prazos', 'Próximos passos'];
    for (const item of expectedItems) {
      console.log(`Contains "${item}":`, bodyText.toLowerCase().includes(item.toLowerCase()));
    }

    // 5/6. Check buttons (save, share, etc.)
    const shareBtn = page.locator('button:has-text("Compartilhar"), a:has-text("Compartilhar"), button:has-text("Copiar"), a:has-text("Copiar Link")');
    console.log('Found share/copy buttons count:', await shareBtn.count());

    // 7/8. Validation / Acceptance flow
    const currentMeetingUrl = page.url();
    const urlParams = new URL(currentMeetingUrl).searchParams;
    const routeVal = urlParams.get('route') || '';
    const meetingId = routeVal.split('/').pop();
    console.log('Extracted meetingId:', meetingId);

    if (meetingId) {
      const validationUrl = `http://localhost:5173/index.html?route=/valida/${meetingId}`;
      console.log('Navigating to public validation URL:', validationUrl);
      await page.goto(validationUrl);
      await page.waitForLoadState('networkidle');
      await page.waitForTimeout(2000);
      await page.screenshot({ path: 'C:/Users/Alexandre/.gemini/antigravity/browser_recordings/04_validation_page.png' });
    }
  } catch (err) {
    console.error('Test execution error:', err);
  } finally {
    await browser.close();
  }
})();
