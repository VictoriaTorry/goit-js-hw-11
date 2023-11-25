import axios from 'axios';
import Notiflix from 'notiflix';
import SimpleLightbox from 'simplelightbox';
import 'simplelightbox/dist/simple-lightbox.min.css';

const API_KEY = '40374972-d5f9b0f3adca24ae39029e0ce';
const BASE_URL = 'https://pixabay.com/api/';
let page = 1;
const numPerPage = 40;
let gallery = new SimpleLightbox('.photo-card a');

const refs = {
  searchForm: document.querySelector('.search-form'),
  gallery: document.querySelector('.gallery'),
  loadMoreBtn: document.querySelector('.load-more'),
};

refs.searchForm.addEventListener('submit', function (e) {
  e.preventDefault();
  page = 1;
  refs.gallery.innerHTML = '';
  processingInformation();
});

refs.loadMoreBtn.addEventListener('click', processingInformation);

async function processingInformation() {
  //отримуємо інформацію з поля пошуку
  let searchedData = refs.searchForm.elements.searchQuery.value
    .trim()
    .split(' ')
    .filter(item => item.length)
    .join('+');
  if (!searchedData) {
    Notiflix.Notify.info('Empty request, please type not only spaces');
    return;
  }
  //запит за сервер
  let fetchedData = await fetchingData(API_KEY, searchedData, page);

  if (!fetchedData.totalHits) {
    Notiflix.Notify.failure(
      'Sorry, there are no images matching your search query. Please try again.'
    );
    return;
  }

  if (fetchedData.totalHits && page === 1) {
    Notiflix.Notify.success(
      `Hooray! We found ${fetchedData.totalHits} images.`
    );
  }

  // створюємо картку
  let renderedCard = fetchedData.hits.map(item =>
    renderingCard(
      item.largeImageURL,
      item.webformatURL,
      item.tags,
      item.likes,
      item.views,
      item.comments,
      item.downloads
    )
  );
  // рендерим на сторінку
  refs.gallery.insertAdjacentHTML('beforeend', renderedCard.join(''));
  gallery.refresh();

  // перевіряємо кількість наявних хітів і добавляємо/прибираємо кнопку loadmore
  if (refs.gallery.children.length === fetchedData.totalHits) {
    refs.loadMoreBtn.style.display = 'none';
    Notiflix.Notify.info(
      "We're sorry, but you've reached the end of search results."
    );
    return observer.unobserve(refs.container.lastElementChild);
  } else if(refs.gallery.children.length < fetchedData.totalHits){
    refs.loadMoreBtn.style.display = 'block';
  }

  page += 1;
  observer.observe(refs.gallery.lastElementChild);
}

async function fetchingData(API_KEY, searchedData, page) {
  const response = await axios.get(
    `${BASE_URL}?key=${API_KEY}&q=${searchedData}&image_type=photo&page=${page}&per_page=${numPerPage}&safesearch=true&orientation=horizontal&pretty=true`
  );
  return response.data;
}

function renderingCard(
  largeImageURL,
  src,
  alt,
  likes,
  views,
  comments,
  downloads
) {
  let card = `<div class="photo-card"> <a class="gallery__link" href="${largeImageURL}"><div class="photo-card__img"><img src="${src}" alt="${alt}" loading="lazy" /></div><div class="info"><p class="info-item"><b>Likes</b><span>${likes}</span></p><p class="info-item"><b>Views</b><span>${views}</span></p><p class="info-item"><b>Comments</b><span>${comments}</span></p><p class="info-item"><b>Downloads</b><span>${downloads}</span></p></div></a></div>`;

  return card;
}

const options = {
  root: null,
  rootMargin: '300px',
  threshold: 1.0,
};

function onLoad(entries) {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      processingInformation();
      onScroll();
    }
  });
}

const observer = new IntersectionObserver(onLoad, options);

window.onscroll = function () {
  const scrolled = window.pageYOffset || document.documentElement.scrollTop; // Отримуємо положення скрола
  if (scrolled) {
    // Якщо прокрутка присутня, то робимо елемент прозорим
    refs.searchForm.style.opacity = '0.5';
  } else {
    // Якщо прокрутки немає, то елемент лишається не прозорим
    refs.searchForm.style.opacity = '1';
  }
};

function onScroll() {
  const { height: cardHeight } = document
    .querySelector('.gallery')
    .firstElementChild.getBoundingClientRect();

  window.scrollBy({
    top: cardHeight * 2,
    behavior: 'smooth',
  });
}
