"use server"
import { NextRequest, NextResponse } from "next/server"
import nodemailer from "nodemailer"

export async function POST(req: NextRequest) {
	try {
		const {
			toEmail,
			storeEmail,
			storePassword,
			agentEmail,
			agentPassword,
		} = await req.json()

		// Validate input
		const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
		if (!toEmail || !emailRegex.test(toEmail)) {
			return NextResponse.json(
				{
					success: false,
					message: "Valid recipient email is required",
				},
				{ status: 400 }
			)
		}

		let emailContent
		let emailSubject
		let emailType

		if (storeEmail && storePassword) {
			emailType = "Store"
			emailSubject = "Your Store Account Details"
			emailContent = `
        <h2>Your Store Account Details</h2>
        <p>Dear User,</p>
        <p>Your store account has been successfully created. Below are your login credentials:</p>
        <ul>
          <li><strong>Email:</strong> ${storeEmail}</li>
          <li><strong>Password:</strong> ${storePassword}</li>
        </ul>
        <p>Please keep this information secure.</p>
        <p>Best Regards,</p>
      `
		} else if (agentEmail && agentPassword) {
			emailType = "Agent"
			emailSubject = "Your Agent Account Details"
			emailContent = `
        <h2>Your Agent Account Details</h2>
        <p>Dear User,</p>
        <p>Your agent account has been created. Below are your login credentials:</p>
        <ul>
          <li><strong>Email:</strong> ${agentEmail}</li>
          <li><strong>Password:</strong> ${agentPassword}</li>
        </ul>
        <p>Please keep this information secure.</p>
        <p>Best Regards,</p>
      `
		} else {
			return NextResponse.json(
				{ success: false, message: "Invalid email data provided" },
				{ status: 400 }
			)
		}

		let transporter = nodemailer.createTransport({
			service: "gmail",
			auth: {
				user: "auribisesproject@gmail.com",
				pass: "ukqa fmcm duvp zphr",
			},
		})

		let mailOptions = {
			from: process.env.EMAIL_USER,
			to: toEmail,
			subject: emailSubject,
			html: emailContent,
		}

		await transporter.sendMail(mailOptions)
		return NextResponse.json({
			success: true,
			message: `${emailType} email sent successfully!`,
		})
	} catch (error: any) {
		console.error("Error sending email:", error)
		return NextResponse.json(
			{
				success: false,
				message: `Failed to send email: ${error.message}`,
			},
			{ status: 500 }
		)
	}
}
