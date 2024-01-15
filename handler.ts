import { APIGatewayProxyHandler } from 'aws-lambda';
import puppeteer from 'puppeteer';
import mysql from 'mysql';

const connection = mysql.createConnection({
  host: 'localhost',
  user: 'root',
  password: '',
  database: 'web-scrapping-database',
});

export const myFunction: APIGatewayProxyHandler = async (event) => {
  try {
    const browser = await puppeteer.launch();
    const page = await browser.newPage();
    await page.goto('https://www.google.com');

    // scraping logic 

    // Wait for the search input box to load and type a query
    await page.type('input[name=q]', 'web scraping');

    // Click on the search button
    await page.click('input[name=btnK]');

    // Wait for the search results to load
    await page.waitForSelector('h3');

    // Extract titles of the search results
    const titles = await page.evaluate(() => {
      const results = document.querySelectorAll('h3');
      return Array.from(results, (result) => result.textContent);
    });

    // Save titles to MySQL
    connection.connect();
    titles.forEach((title) => {
      connection.query('INSERT INTO google_search_results (title) VALUES (?)', [title], (error, results) => {
        if (error) throw error;
        console.log('Data inserted:', results);
      });
    });
    connection.end();

    await browser.close();

    return {
      statusCode: 200,
      body: JSON.stringify({ message: 'Scraping and data insertion successful!' }),
    };
  } catch (error) {
    console.error('Error:', error);

    return {
      statusCode: 500,
      body: JSON.stringify({ message: 'Internal Server Error' }),
    };
  }
};
