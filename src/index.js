const puppeteer = require('puppeteer');

const ADMIN_USERNAME = 'superadmin';
const ADMIN_PASSWORD = 'superpaswoord';
const data = {
  username: 'nieuwe.gebruiker',
  password: 'paswoord20!#',
  firstName: 'Nieuwe',
  lastName: 'Gebruiker',
  email: 'email@email.com',
  lang: 'NL',
  tel: '0400000000',
  deactivationDate: '20/10/2025',
  // 14 is EMoneysafe_shop4me
  // 19 is MS_Badge_Sales
  // 12 is MS_Reader
  profileId: '14',
  // 81369 is MODELGEBRUIKER.SFEVERGEM
  // 21877 is STANDAARD.SFE
  // 21878 is STANDAARD.ADMIN
  model: '21877',
};

async function createUser() {
  console.log('Creating money safe user', data)

  // Als je headless op false zet dan kan je het visueel zien gebeuren
  // slowMo is dat het trager gaat zodanig dat je kan zien wat er fout loopt
  // voor debugging best op false en slowMo op 50
  const browser = await puppeteer.launch({ headless: false, slowMo: 50 });
  const page = await browser.newPage();

  // Set User-Agent
  await page.setUserAgent(
    'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Safari/537.36',
  );

  // Navigate to login page
  await page.goto('https://click4food.compass-group.be/index.cfm', {
    waitUntil: 'networkidle2',
  });

  // Accept cookies
  console.log('Accepting cookies');
  await page.click('#btnAccept');

  // Fill in login form and submit
  console.log('Logging in');
  await page.type('#txtLogin', ADMIN_USERNAME);
  await page.type('#txtPassword', ADMIN_PASSWORD);
  await Promise.all([
    page.click('#autologinCheck'),
    page.click('button[name="btn_valider"]'),
    page.waitForNavigation({ waitUntil: 'networkidle2' }),
  ]);

  await page.hover('.l1div');
  await page.click('img[appliurl="/administration/security/users/index.cfm"]');

  const userPage = (await browser.pages())[2];
  await new Promise((r) => setTimeout(r, 1000)); // Optional delay to ensure the page is fully loaded

  // Get the iframe handle
  console.log('Waiting for the iframe to load...');
  await userPage.waitForSelector('frame[name="Security_Users_Top"]');
  const frameElement = await userPage.$('frame[name="Security_Users_Top"]');
  const framePage = await frameElement.contentFrame();

  // Interact with the iframe content
  console.log('Interacting with form elements...');
  await framePage.waitForSelector('button[name="add"]', { visible: true });
  await framePage.click('button[name="add"]');
  await new Promise((r) => setTimeout(r, 1000)); // Optional delay

  // For user is model
  // await framePage.click('#userIsTemplate');

  await framePage.type('#txtLogin', data.username);
  await framePage.click('#btn-resetpwd');
  await framePage.type('#newPassword', data.password);
  await framePage.type('#txtFirstName', data.firstName);
  await framePage.type('#txtName', data.lastName);
  await framePage.type('#txtEmail', data.email);
  await framePage.select('#txtLang', data.lang);
  await framePage.type('#txtTel', data.tel);
  await framePage.type('#dateDeactivation', data.deactivationDate);
  await framePage.$eval('#dateDeactivation', (e) => e.blur());
  await framePage.select('#profileId', data.profileId);
  await framePage.select('#templateUserId', data.model);

  console.log('Sending user details...');
  await framePage.click('#actionBtn');

  await userPage.waitForRequest(
    'https://click4food.compass-group.be/administration/security/users/cfm/user_div.cfm?id=0&frm=add',
  );

  await browser.close();
}

createUser().catch((error) => console.error(error));
