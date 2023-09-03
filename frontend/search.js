let table;
let dataStore = {};

$(document).ready(function() {
    table = $('#resultTable').DataTable({
        "language": {
            "url": "https://cdn.datatables.net/plug-ins/1.10.24/i18n/Portuguese-Brasil.json"
        },
        "retrieve": true,
        "destroy": true
    });
    $('[title]').tooltip();
});

function generateModalContent(reviewData) {
    return reviewData.filter(review => review.text) // ignore reviews without text
        .map(review => {
            console.log(review.rating); // Add this line
            let rating = parseFloat(review.rating) || 0;
            let fullStars = '<i class="fas fa-star"></i>'.repeat(Math.floor(rating));
            let halfStar = ((rating - Math.floor(rating)) !== 0 ) ? '<i class="fas fa-star-half-alt"></i>' : '';
            return `<h5>${review.author_name} ${fullStars}${halfStar}</h5>
                    <p>${review.text}</p>`;
        })
        .join('');
}

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


function createResultHtml(data) {
    // se o input id onlyOpen estiver marcado no html mostrar somente estabelecimentos abertos
    if (document.getElementById("onlyOpen").checked) {
        data = data.filter(item => item.result.opening_hours && item.result.opening_hours.open_now);
    }
    data.sort((a, b) => {
        let a_open = (a.result.opening_hours && a.result.opening_hours.open_now) ? 1 : 0;
        let b_open = (b.result.opening_hours && b.result.opening_hours.open_now) ? 1 : 0;

        if (a_open && !b_open) {
            return -1; // a_open true, b_open false, move a up
        }
        if (!a_open && b_open) {
            return 1; // a_open false, b_open true, move a down
        }

        let a_rating = a.result.rating || 0;
        let b_rating = b.result.rating || 0;
        return b_rating - a_rating;
    });

    dataStore = data;

    return data.map((item, index) => {
        const rating = item.result.rating !== undefined ? item.result.rating : 0;
        const fullStars = '<i class="fas fa-star"></i>'.repeat(Math.floor(rating));
        const halfStar = ((rating - Math.floor(rating)) !== 0 ) ? '<i class="fas fa-star-half-alt"></i>' : '';
        const ratingHTML = `${fullStars}${halfStar}`;
        let details = {
            name: item.result.name || 'Not Available',
            address: item.result.formatted_address || 'Not Available',
            phoneNumber: item.result.formatted_phone_number || 'Not Available',
            reviews: item.result.reviews && Array.isArray(item.result.reviews) ? item.result.reviews.length : 0,
            website: item.result.website || "Not Available",
            url: item.result.url || "Not Available",
            rating: ratingHTML,
            isOpen: item.result.opening_hours && item.result.opening_hours.open_now
                ? "<span class='badge bg-success'><i class='fas fa-arrow-up'></i> Open</span>"
                : "<span class='badge bg-danger'><i class='fas fa-arrow-down'></i> Closed</span>"
        };
        return getTableRow(details, index);
    }).join("");
}
function getTableRow(details, index){
    return `
      <tr>
            <td>${details.name}</td>
            <td>${details.address}</td>
            <td><a href="${details.url}" target="_blank">Ver link</a></td>
            <td><a href="tel:${details.phoneNumber}">${details.phoneNumber}</a></td>
            <td><a href="#" onclick="openModal(${index}, 'reviews')">Ver avaliações (${details.reviews})</a></td>
            <td><a href="${details.website}" target="_blank">Acessar site</a></td>
            <td>${details.rating}</td>
            <td><a href="#" onclick="openModal(${index}, 'hours')">${details.isOpen}</a></td>
      </tr>
   `;
}

document.getElementById("myForm").addEventListener("submit", function(event) {
    event.preventDefault();
    const query = document.getElementById("query").value;
    document.getElementById("contentResultTable").style.display = "block";
    table.destroy(); // primeiro destruir a tabela
    fetch(`http://localhost:8080/search?query=${query}`, { method: 'GET' })
        .then(response => response.json())
        .then(data => {
            const resultHtml = createResultHtml(data);
            document.getElementById("resultTable").querySelector("tbody").innerHTML = resultHtml; // depois atualizar os dados
            table = $('#resultTable').DataTable({ // finalmente, recriar a tabela
                "language": {
                    "url": "https://cdn.datatables.net/plug-ins/1.10.24/i18n/Portuguese-Brasil.json"
                },
                "retrieve": true
            });
        })
        .catch((error) => console.error('Error:', error));
});

document.getElementById("clearTable").addEventListener("click", function() {
    table.clear().draw();
    dataStore = {};
});

let placeholders = ["Ex: Restaurante na Paulista", "Ex: Mecânica em Curitiba ", "Ex: Café no aeroporto de Guarulhos", "Ex: Cinema em Porto Alegre", "Ex: Ponto de táxi em Copacabana", "Ex: Rodoviária em Fortaleza", "Ex: Museus em BH", "Ex: Farmácias no centro", "Ex: Supermercados próximos"];
let index = 0;

function alterarPlaceholder() {
    let inputElement = document.getElementById("query");
    inputElement.placeholder = placeholders[index];
    index++;
    if (index >= placeholders.length) {
        index = 0;
    }
}
window.onload = function() {
    setInterval(alterarPlaceholder, 2000);
};