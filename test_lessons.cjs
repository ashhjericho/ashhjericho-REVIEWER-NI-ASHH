const {chromium}=require('playwright');
(async()=>{
  const browser=await chromium.launch({headless:true,executablePath:'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe',args:['--no-sandbox']});
  const page=await browser.newPage({viewport:{width:390,height:844}});
  await page.goto('http://127.0.0.1:8765/');
  await page.getByText('Available modules').waitFor();
  if(await page.getByRole('link',{name:/upload/i}).count()) throw Error('Upload link remains visible');
  await page.goto('http://127.0.0.1:8765/upload');
  await page.waitForURL('**/modules');
  await page.getByText('Module 1',{exact:true}).waitFor();
  let count=await page.locator('.card h3').count();
  if(count!==7) throw Error(`Expected seven modules, found ${count}`);
  console.log('Seven existing modules available; upload navigation removed; old link redirects to modules.');
  await browser.close();
})().catch(e=>{console.error(e);process.exit(1)});
