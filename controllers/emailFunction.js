const db = require('./promise').Db;
var cron = require('node-cron');
const path = require('path');
const fs = require('fs');
const mailgun = require('mailgun-js');
const mg = mailgun({
	apiKey: process.env.MAILGUN_API_KEY,
	domain: process.env.MAILGUN_DOMAIN,
});

var sendWeeklyEmail = function sendEmail(foundJobs) {

	// var task = cron.schedule('* * * * Monday', () =>  {      //this works weekly. Uncomment for production
        
	cron.schedule('0 */1 * * * *', () => {      //this works every minutes. Uncomment after test
		const filename = path.normalize(path.join(__dirname, '../email-templates/remote_job.hbs'));
		const job_link = foundJobs.job_link || '';
		const html = fs
			.readFileSync(filename)
			.toString()
			.replace(/{{job_title}}/, foundJobs.job_title)
			.replace(/{{company_name}}/, foundJobs.company_name)
			.replace(/{{image_link}}/, foundJobs.image_link)
			.replace(/{{job_link}}/, job_link)
            .replace(/ {{career_level}}/, foundJobs.career_level);
            
		var emailing = function agentEmail(foundJobs) {
			for (var i = 0; i < foundJobs.length; i++) {
				var agent = foundJobs[i];
				return agent.employer_email;
			}
		};

		emailing(foundJobs);
		var data = {
			from: 'Devalert <noreply@devalert.com>',
			to: searching(foundJobs),
			subject: 'New Remote job Alert!',
			html: html.replace(/{{email}}/, searching(foundJobs)),
		};
		mg.messages().send(data, (error, body) => {
			if (error) {
				console.log('Email not sent');
				console.log(error);
			} else {
				console.log('Email sent');
			}
		});
	});
};


module.exports = {
    sendWeeklyEmail
};
  