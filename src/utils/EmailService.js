const nodemailer = require('nodemailer');

class EmailService {
    constructor(logger = null) {
        this.logger = logger;
        this.transporter = null;
    }

    getTransporter() {
        if (!this.transporter) {
            const gmailUser = process.env.GMAIL_USER;
            const gmailAppPassword = process.env.GMAIL_APP_PASSWORD;

            if (!gmailUser || !gmailAppPassword) {
                throw new Error('Gmail credentials not configured. Please set GMAIL_USER and GMAIL_APP_PASSWORD environment variables.');
            }

            this.transporter = nodemailer.createTransport({
                service: "Gmail",
                host: "smtp.gmail.com",
                port: 465,
                secure: true,
                auth: {
                    user: gmailUser,
                    pass: gmailAppPassword,
                },
            });

            if (this.logger) {
                this.logger.info('Nodemailer transporter configured', {
                    service: 'Gmail',
                    user: gmailUser
                });
            }
        }

        return this.transporter;
    }

    async sendConfirmationEmail(appointmentData) {
        const { customerEmail, customerName, barber, service, date, time, confirmationCode } = appointmentData;

        if (this.logger) {
            this.logger.info('Sending confirmation email', {
                customerEmail,
                appointmentDate: date,
                appointmentTime: time,
                confirmationCode
            });
        }

        const transporter = this.getTransporter();
        
        const emailContent = {
            from: process.env.GMAIL_USER,
            to: customerEmail,
            subject: `Confirmação de Agendamento - ${confirmationCode}`,
            html: this.generateEmailTemplate(appointmentData),
            text: this.generateEmailText(appointmentData)
        };

        if (this.logger) {
            this.logger.info('Email content prepared', {
                from: emailContent.from,
                to: emailContent.to,
                subject: emailContent.subject
            });
        }

        try {
            const info = await transporter.sendMail(emailContent);

            if (this.logger) {
                this.logger.info('Email sent successfully', {
                    messageId: info.messageId,
                    response: info.response,
                    customerEmail,
                    confirmationCode
                });
            }

            return {
                success: true,
                messageId: info.messageId,
                sentAt: new Date().toISOString()
            };
        } catch (error) {
            if (this.logger) {
                this.logger.error('Error sending email', error, {
                    customerEmail,
                    confirmationCode,
                    errorMessage: error.message
                });
            }
            throw new Error('EMAIL_SEND_FAILED');
        }
    }

    generateEmailTemplate(appointmentData) {
        const { customerName, barber, service, date, time, confirmationCode, customerWhatsapp, paymentMethod } = appointmentData;
        
        return `
            <!DOCTYPE html>
            <html>
            <head>
                <meta charset="utf-8">
                <style>
                    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
                    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
                    .header { background-color: #1a1a1a; color: white; padding: 20px; text-align: center; }
                    .content { padding: 20px; background-color: #f9f9f9; }
                    .details { background-color: white; padding: 15px; margin: 10px 0; border-left: 4px solid #1a1a1a; }
                    .confirmation-code { font-size: 24px; font-weight: bold; color: #1a1a1a; text-align: center; padding: 10px; }
                    .footer { text-align: center; padding: 20px; color: #666; font-size: 12px; }
                </style>
            </head>
            <body>
                <div class="container">
                    <div class="header">
                        <h1>Distrito Barbearia</h1>
                    </div>
                    <div class="content">
                        <h2>Olá, ${customerName}!</h2>
                        <p>Seu agendamento foi confirmado com sucesso.</p>
                        
                        <div class="details">
                            <h3>Detalhes do Agendamento</h3>
                            <p><strong>Barbeiro:</strong> ${barber.name}</p>
                            <p><strong>Especialidade:</strong> ${barber.specialty}</p>
                            <p><strong>Serviço:</strong> ${service.name}</p>
                            <p><strong>Preço:</strong> R$ ${service.price.toFixed(2)}</p>
                            <p><strong>Duração:</strong> ${service.duration} minutos</p>
                            <p><strong>Data:</strong> ${this.formatDate(date)}</p>
                            <p><strong>Horário:</strong> ${time}</p>
                            <p><strong>Forma de Pagamento:</strong> ${paymentMethod === 'later' ? 'Pagar no local' : 'Pago antecipadamente'}</p>
                        </div>
                        
                        <div class="confirmation-code">
                            Código de Confirmação: ${confirmationCode}
                        </div>
                        
                        <p>Por favor, apresente este código quando chegar na barbearia.</p>
                        <p>Se precisar alterar ou cancelar seu agendamento, entre em contato conosco pelo WhatsApp: ${customerWhatsapp}</p>
                    </div>
                    <div class="footer">
                        <p>Distrito Barbearia - Agradecemos sua preferência!</p>
                    </div>
                </div>
            </body>
            </html>
        `;
    }

    generateEmailText(appointmentData) {
        const { customerName, barber, service, date, time, confirmationCode, customerWhatsapp, paymentMethod } = appointmentData;
        
        return `
Olá, ${customerName}!

Seu agendamento foi confirmado com sucesso.

DETALHES DO AGENDAMENTO:
- Barbeiro: ${barber.name}
- Especialidade: ${barber.specialty}
- Serviço: ${service.name}
- Preço: R$ ${service.price.toFixed(2)}
- Duração: ${service.duration} minutos
- Data: ${this.formatDate(date)}
- Horário: ${time}
- Forma de Pagamento: ${paymentMethod === 'later' ? 'Pagar no local' : 'Pago antecipadamente'}

CÓDIGO DE CONFIRMAÇÃO: ${confirmationCode}

Por favor, apresente este código quando chegar na barbearia.
Se precisar alterar ou cancelar seu agendamento, entre em contato conosco pelo WhatsApp: ${customerWhatsapp}

Distrito Barbearia - Agradecemos sua preferência!
        `;
    }

    formatDate(date) {
        const [year, month, day] = date.split('-');
        return `${day}/${month}/${year}`;
    }
}

module.exports = { EmailService };

