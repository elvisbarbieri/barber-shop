class AppointmentMapper {
    map(data) {
        return {
            barberId: data.barberId,
            serviceId: data.serviceId,
            date: data.date,
            time: data.time,
            customerName: data.customerName,
            customerEmail: data.customerEmail,
            customerWhatsapp: data.customerWhatsapp,
            paymentMethod: data.paymentMethod,
            status: 'confirmed',
            createdAt: new Date().toISOString(),
            confirmationCode: this.generateConfirmationCode()
        };
    }

    generateConfirmationCode() {
        const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
        let code = '';
        for (let i = 0; i < 6; i++) {
            code += chars.charAt(Math.floor(Math.random() * chars.length));
        }
        return code;
    }
}

module.exports = { AppointmentMapper };

