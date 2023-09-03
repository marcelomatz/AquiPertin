function openModal(index, type) {
    let modalContent;
    let modal;
    switch (type) {
        case 'reviews':
            modalContent = generateModalContent(dataStore[index].result.reviews);
            modal = $('#reviewsModal');
            break;

        case 'hours':
            modalContent = dataStore[index].result.opening_hours.weekday_text.map(hours => `<p>${hours}</p>`).join('');
            modal = $('#hoursModal');
            break;
    }
    modal.find('.modal-body').html(modalContent);
    modal.modal('show');
}

function closeModals() {
    $('#reviewsModal').modal('hide');
    $('#hoursModal').modal('hide');
}