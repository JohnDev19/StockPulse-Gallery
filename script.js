const accessKey = 's37pupxYji4yXlyw3djWVrQZGhnvCx6KMcC_0p-TViA';
const imagesPerPage = 12;
let currentPage = 1;
let currentQuery = '';
let currentOrientation = 'all';
let currentSort = 'relevant';
let totalPages = 1;

const searchInput = document.getElementById('search-input');
const imageGallery = document.getElementById('image-gallery');
const prevButton = document.getElementById('prev-button');
const nextButton = document.getElementById('next-button');
const filterButtons = document.querySelectorAll('.filter-button');
const customSelect = document.querySelector('.custom-select-container');
const customSelectTrigger = document.querySelector('.custom-select-trigger');
const customSelectOptions = document.querySelector('.custom-select-options');
const selectedValue = document.querySelector('.selected-value');
const loadingIndicator = document.getElementById('loading-indicator');
const modal = document.getElementById('image-modal');
const modalImage = modal.querySelector('.modal-image');
const modalClose = modal.querySelector('.modal-close');
const currentPageSpan = document.getElementById('current-page');
const totalPagesSpan = document.getElementById('total-pages');
const toast = document.getElementById('toast');
const errorContainer = document.getElementById('error-container');
const pagination = document.getElementById('pagination');

searchInput.addEventListener('input', debounce(() => {
    currentQuery = searchInput.value;
    currentPage = 1;
    fetchImages();
}, 500));

prevButton.addEventListener('click', () => {
    if (currentPage > 1) {
        currentPage--;
        fetchImages();
    }
});

nextButton.addEventListener('click', () => {
    if (currentPage < totalPages) {
        currentPage++;
        fetchImages();
    }
});

filterButtons.forEach(button => {
    button.addEventListener('click', () => {
        filterButtons.forEach(btn => btn.classList.remove('active'));
        button.classList.add('active');
        currentOrientation = button.dataset.orientation;
        currentPage = 1;
        fetchImages();
    });
});

customSelectTrigger.addEventListener('click', () => {
    customSelect.classList.toggle('active');
});

document.addEventListener('click', (e) => {
    if (!customSelect.contains(e.target)) {
        customSelect.classList.remove('active');
    }
});

customSelectOptions.querySelectorAll('.custom-select-option').forEach(option => {
    option.addEventListener('click', () => {
        const value = option.dataset.value;
        selectedValue.textContent = option.textContent;

        customSelectOptions.querySelectorAll('.custom-select-option').forEach(opt => {
            opt.classList.remove('selected');
        });

        option.classList.add('selected');

        customSelect.classList.remove('active');

        currentSort = value;
        currentPage = 1;
        fetchImages();
    });
});

function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

function showLoading() {
    loadingIndicator.style.display = 'block';
    imageGallery.style.opacity = '0.5';
}

function hideLoading() {
    loadingIndicator.style.display = 'none';
    imageGallery.style.opacity = '1';
}

function showToast(message, type = 'success') {
    toast.textContent = message;
    toast.style.backgroundColor = type === 'success' ? 'var(--success-color)' : 'var(--error-color)';
    toast.style.display = 'block';
    setTimeout(() => {
        toast.style.display = 'none';
    }, 3000);
}

function smoothScrollToResults() {
    const targetElement = errorContainer.style.display === 'flex' ? errorContainer : imageGallery;
    const headerOffset = 100;
    const elementPosition = targetElement.getBoundingClientRect ().top + window.pageYOffset;
    const offsetPosition = elementPosition - headerOffset;

    window.scrollTo({
        top: offsetPosition,
        behavior: 'smooth'
    });
}

async function fetchImages() {
    showLoading();
    errorContainer.style.display = 'none';
    imageGallery.style.display = 'grid';
    pagination.style.display = 'flex';

    const sortMapping = {
        'relevant': 'relevant',
        'latest': 'latest',
        'popular': 'popular'
    };

    const orientation = currentOrientation === 'all' ? '' : `&orientation=${currentOrientation}`;
    const query = currentQuery.trim() || 'nature';
    const sortParam = sortMapping[currentSort] || 'relevant';
    const url = `https://api.unsplash.com/search/photos?query=${query}&page=${currentPage}&per_page=${imagesPerPage}${orientation}&order_by=${sortParam}&client_id=${accessKey}`;

    try {
        const response = await fetch(url);
        const data = await response.json();

        if (data.results.length === 0) {
            showError();
            disablePagination();
        } else {
            totalPages = Math.ceil(data.total / imagesPerPage);
            displayImages(data.results);
            updatePaginationInfo();
            enablePagination();
            smoothScrollToResults();
        }

    } catch (error) {
        console.error('Error fetching images:', error);
        showToast('Error loading images. Please try again.', 'error');
        showError('An error occurred while loading images. Please try again later.');
        disablePagination();
        smoothScrollToResults();
    } finally {
        hideLoading();
    }
}

function showError(message = 'No results found') {
    errorContainer.querySelector('.error-message').textContent = message;
    errorContainer.style.display = 'flex';
    imageGallery.style.display = 'none';
    disablePagination();
}

function disablePagination() {
    pagination.style.display = 'none';
    prevButton.disabled = true;
    nextButton.disabled = true;
}

function enablePagination() {
    pagination.style.display = 'flex';
    updatePaginationInfo();
}

function updatePaginationInfo() {
    currentPageSpan.textContent = currentPage;
    totalPagesSpan.textContent = totalPages;
    prevButton.disabled = currentPage === 1;
    nextButton.disabled = currentPage === totalPages;
}

function displayImages(images) {
    imageGallery.innerHTML = '';

    images.forEach(image => {
        const card = document.createElement('div');
        card.className = 'image-card';

        card.innerHTML = `
            <div class="image-wrapper">
                <img src="${image.urls.regular}" alt="${image.alt_description || 'Stock Pulse Image'}">
            </div>
            <div class="image-info">
                <div class="image-stats">
                    <span class="likes-count">
                        <i class="fas fa-heart"></i> ${image.likes}
                    </span>
                    <button class="overlay-button download-button">
                      Download
                    </button>
                </div>
            </div>
        `;

        card.querySelector('.image-wrapper img').addEventListener('click', () => {
            showModal(image);
        });

        const downloadButton = card.querySelector('.download-button');

downloadButton.addEventListener('click', (event) => {
    event.stopPropagation();
    const downloadUrl = image.urls.raw;
    const a = document.createElement('a');
    a.href = downloadUrl;
    a.download = '';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    showToast('Download started!');
});

imageGallery.appendChild(card);
    });
}

function showModal(image) {
    modalImage.src = image.urls.regular;
    modalImage.alt = image.alt_description || 'Stock Pulse Image';
    modal.querySelector('.modal-title').textContent = image.alt_description || 'Image Details';
    modal.querySelector('.photographer-name').textContent = image.user.name || 'Unknown Photographer';
    modal.querySelector('.likes-count').innerHTML = `<i class="fas fa-heart"></i> ${image.likes} likes`;

    const photographerImage = modal.querySelector('.photographer-image');
    photographerImage.src = image.user.profile_image.small;
    photographerImage.alt = `${image.user.name}'s profile picture`;

    modal.querySelector('.modal-description').textContent = image.description || ' ';

    const downloadButton = modal.querySelector('.download-button');
    downloadButton.onclick = () => {
        const downloadUrl = image.urls.raw;
        const a = document.createElement('a');
        a.href = downloadUrl;
        a.download = '';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        showToast('Download started!');
    };

    modal.style.display = 'block';
    document.body.style.overflow = 'hidden';
}

modalClose.addEventListener('click', () => {
    modal.style.display = 'none';
    document.body.style.overflow = 'auto';
});

window.addEventListener('click', (e) => {
    if (e.target === modal) {
        modal.style.display = 'none';
        document.body.style.overflow = 'auto';
    }
});

fetchImages();