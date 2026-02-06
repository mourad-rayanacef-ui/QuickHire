const prisma = require("../config/prisma");
const cron = require('node-cron');
const axios = require('axios'); // For downloading the logo
const nodemailer = require('nodemailer'); // For sending email
const { generateAttestationPDF } = require("../services/pdfGenerator");
const https = require('https');


async function getImageAsBase64(url) {
  if (!url) return null;
  try {
    // We create a custom agent to FORCE IPv4 (family: 4)
    const agent = new https.Agent({ family: 4 });

    const response = await axios.get(url, { 
      responseType: 'arraybuffer',
      httpsAgent: agent, // <--- This forces IPv4
      timeout: 10000     // <--- Add a timeout (10s) so it doesn't hang forever
    });

    const buffer = Buffer.from(response.data, 'binary').toString('base64');
    const contentType = response.headers['content-type'];
    return `data:${contentType};base64,${buffer}`;
  } catch (error) {
    console.error(`⚠️ Failed to load image from ${url}:`, error.message);
    // If it fails, we return null so the PDF generates without the logo instead of crashing
    return null; 
  }
}

const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

const CronJobs = () => {


  cron.schedule('30 8 * * *', async () => {
    console.log("🕒 Checking for jobs ending today...");

    try {
    
      const today = new Date();
      const startOfToday = new Date(today.setHours(0, 0, 0, 0));
      const endOfToday = new Date(today.setHours(23, 59, 59, 999));

      // 2. Find Jobs
      const jobsEndingToday = await prisma.job_Hiring_History.findMany({
        where: {
          End_Date: {
            gte: startOfToday,
            lte: endOfToday
          }
        },
        include: {
          user: true,
          company: true
        }
      });

      if (jobsEndingToday.length === 0) {
       
        return;
      }

  
      const transporter = nodemailer.createTransport({
        service: 'gmail',
        family: 4,
        auth: {
          user: process.env.EMAIL_USER, // Make sure these are in your .env
          pass: process.env.EMAIL_PASS
        }
      });


      for (const job of jobsEndingToday) {
    
        const userName = `${job.user.FirstName || ''} ${job.user.LastName || ''}`.trim();
        const companyName = job.company.Name || 'the company';
        const userEmail = job.user.Email;


        try {
          // Convert Cloudinary URL to Base64
          const base64Logo = await getImageAsBase64(job.company.Logo);

          const pdfData = {
            workerName: userName,
            companyName: companyName,
            companyLocation: job.company.MainLocation || 'Remote',
            companyEmail: job.company.Email || '',
            companyWebsite: job.company.Website || '',
            companyLogo: base64Logo || '', 
            jobTitle: job.Job_Name || 'Employee',
            jobId: job.id,
            startDate: job.Start_Date,
            endDate: job.End_Date
          };

          // Generate the PDF Buffer
          let pdfBuffer = await generateAttestationPDF(pdfData);

          // Send Email with Attachment
          if (userEmail) {
            await transporter.sendMail({
              from: '"QuickHire Platform" <no-reply@QuickHire.com>',
              to: userEmail,
              subject: `Job Completed at ${companyName} - Your Certificate of Employment`,
              html: `
                <p>Hello <strong>${job.user.FirstName}</strong>,</p>
                <p>Your job with <strong>${companyName}</strong> has officially ended today.</p>
                <p>We hope it was a great experience! Please find attached your official <strong>Certificate of Employment</strong>.</p>
                <p>Don't forget to rate the company on our platform.</p>
                <br>
                <p>Best regards,<br>The QuickHire Team</p>
              `,
              attachments: [
                {
                  filename: `Certificate_${job.user.LastName || 'Employment'}.pdf`,
                  content: pdfBuffer,
                  contentType: 'application/pdf'
                }
              ]
            });

            pdfBuffer = null;
     
          }
        } catch (pdfError) {
          console.error(`❌ Error generating/sending PDF for job ${job.id}:`, pdfError);
          // We continue to notifications even if PDF fails
        }

        const userNotif = await prisma.user_Notifications_History.create({
          data: {
            User_id: job.User_id,
            Content: `Your job at "${companyName}" has ended. How was your experience? Rate them now!`,
            Date: new Date(),
            Type: "Completed"
          }
        });

       
        const compNotif = await prisma.company_Notifications_History.create({
          data: {
            Company_id: job.Company_id,
            Content: `The contract for "${job.Job_Name || 'a position'}" with ${userName} is over. Please rate their work!`,
            Date: new Date(),
            Type: "Completed"
          }
        });

        // Update Job History with Notification IDs
        await prisma.job_Hiring_History.update({
          where: { id: job.id },
          data: {
            UserNotificationId: userNotif.Notification_id,
            CompanyNotificationId: compNotif.Notification_id
          }
        });

         const otherActiveJobs = await prisma.job_Hiring_History.findFirst({
          where: {
            User_id: job.User_id,
            End_Date: {
              gt: endOfToday ,
            }
          }
        });

          await prisma.user.update({
            where: { User_id: job.User_id },
            data: {
              Status: otherActiveJobs ? "CurrentlyWorking" : "JobSeeker"
            }
          });

       
     

   
        await sleep(2000);
      }

     

    } catch (error) {
      console.error("❌ Cron Job Fatal Error:", error);
    }
  });

  cron.schedule('0 10 * * *', async () => {
    console.log("🕒 Setting 'CurrentlyWorking' status for new starters...");
    try {
        const startOfToday = new Date(new Date().setHours(0, 0, 0, 0));
        const endOfToday = new Date(new Date().setHours(23, 59, 59, 999));

        const newStarters = await prisma.job_Hiring_History.findMany({
            where: {
                Start_Date: {
                    gte: startOfToday,
                    lte: endOfToday
                }
            },
            select: { User_id: true } 
        });

        if (newStarters.length > 0) {
            const ids = newStarters.map(job => job.User_id);
            
            const result = await prisma.user.updateMany({
                where: { User_id: { in: ids } },
                data: { Status: "CurrentlyWorking" }
            });
            
      
        } 
    } 
    catch (error) {
        console.error("❌ Starter Cron Error:", error);
    }
});
};

module.exports = CronJobs;