class AppointmentResponseMapper {
    map(appointment, barber, service, result) {
        return {
            id: result.insertedId.toString(),
            barber: {
                id: barber.id,
                name: barber.name,
                specialty: barber.specialty
            },
            service: {
                id: service.id,
                name: service.name,
                price: service.price,
                duration: service.duration
            },
            date: appointment.date,
            time: appointment.time,
            customerName: appointment.customerName,
            customerEmail: appointment.customerEmail,
            customerWhatsapp: appointment.customerWhatsapp,
            paymentMethod: appointment.paymentMethod,
            status: appointment.status,
            createdAt: appointment.createdAt,
            confirmationCode: appointment.confirmationCode
        };
    }
}

module.exports = { AppointmentResponseMapper };

