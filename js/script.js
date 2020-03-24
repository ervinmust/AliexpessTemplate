document.addEventListener('DOMContentLoaded', () => {
    const search = document.querySelector('.search');
    const cartBtn = document.getElementById('cart');
    const wishlistBtn = document.getElementById('wishlist');
    const goodsWrapper = document.querySelector('.goods-wrapper');
    const cart = document.querySelector('.cart');
    const category = document.querySelector('.category');
    const cardCounter = cartBtn.querySelector('.counter');
    const wishlistCounter = wishlistBtn.querySelector('.counter'); 
    const cartWrapper = document.querySelector('.cart-wrapper');

    let wishlist = [];
    let goodsCart = {};

    const loading = (nameFunction) => {
        const spinner = `<div id="spinner"><div class="spinner-loading"><div><div><div></div>
        </div><div><div></div></div><div><div></div></div><div><div></div></div></div></div></div>`;
        
        if (nameFunction === 'renderCard') {
            goodsWrapper.innerHTML = spinner;
        }

        if (nameFunction === 'renderCart') {
            cartWrapper.innerHTML = spinner;
        }
    }

    /* Запрос на сервер */
    const getGoods = (handler, filter) => {
        loading(handler.name);
        fetch('./db/db.json')
            .then(response => response.json())
            .then(filter)
            .then(handler);
    }

    /* Генерация карточек */
    const createCardGoods = (id, title, price, img) => {
        const card = document.createElement('div');
        card.className = 'card-wrapper col-12 col-md-6 col-lg-4 col-xl-3 pb-3';
        card.innerHTML = `<div class="card">
                                <div class="card-img-wrapper">
                                    <img class="card-img-top" src="${img}" alt="">
                                    <button class="card-add-wishlist ${wishlist.indexOf(id) + 1 ? 'active' : ''}"
                                    data-goods-id="${id}"></button>
                                </div>
                                <div class="card-body justify-content-between">
                                    <a href="#" class="card-title">${title}</a>
                                    <div class="card-price">${price} ₽</div>
                                    <div>
                                        <button class="card-add-cart" data-goods-id="${id}">Добавить в корзину</button>
                                    </div>
                                </div>
                            </div>`;

        return card;
    }

    /* Рендер товаров в корзине */
    const createCartGoods = (id, title, price, img) => {
        const card = document.createElement('div');
        card.className = 'goods';
        card.innerHTML = `<div class="goods">
        <div class="goods-img-wrapper">
            <img class="goods-img" src="${img}" alt="">

        </div>
        <div class="goods-description">
            <h2 class="goods-title">${title}</h2>
            <p class="goods-price">${price} ₽</p>

        </div>
        <div class="goods-price-count">
            <div class="goods-trigger">
                <button class="goods-add-wishlist ${wishlist.indexOf(id) + 1 ? 'active' : ''}" data-goods-id="${id}"></button>
                <button class="goods-delete" data-goods-id="${id}"></button>
            </div>
            <div class="goods-count">${goodsCart[id]}</div>
        </div>
        </div>`;

        return card;
    }

    /* Рендеры */
    const renderCard = items => {
        goodsWrapper.textContent = '';  
        if (items.length) {
            items.forEach(({id, title, price, imgMin}) => {
                goodsWrapper.appendChild(createCardGoods(id, title, price, imgMin));
            });
        } else {
            goodsWrapper.textContent = 'Сорянчики. Мы не нашли товаров по вашему запросу'; 
        }
    };

    const renderCart = items => {
        cartWrapper.textContent = '';  
        if (items.length) {
            items.forEach(({id, title, price, imgMin}) => {
                cartWrapper.appendChild(createCartGoods(id, title, price, imgMin));
            });
        } else {
            cartWrapper.innerHTML = '<div id="cart-empty">Ваша корзина пока пуста</div>'; 
        }
    };

    /* Счетчик товаров в корзине и избранных */
    const checkCount = () => {
        wishlistCounter.textContent = wishlist.length;
        cardCounter.textContent = Object.keys(goodsCart).length;
    }

    /* Калькуляция общей суммы */
    const calcTotalPrice = goods => {
        let sum = goods.reduce((accum, item) => {
            return accum + item.price * goodsCart[item.id];
        }, 0);
        cart.querySelector('.cart-total>span').textContent = sum.toFixed(2);
    };
    
    /* Фильтры */
    const showGoodsCart = goods => {
        const goodsFilter = goods.filter(item => goodsCart.hasOwnProperty(item.id));
        calcTotalPrice(goodsFilter);
        return goodsFilter;
    };

    const randomSort = items => {
        return items.sort(() => Math.random() - 0.5);
    };

    const showWishlist = e => {
        getGoods(renderCard, goods => goods.filter(item => wishlist.includes(item.id)))
    }

    /* Работа с хранилищами */
    const getCookie = name => {
        let matches = document.cookie.match(new RegExp(
          "(?:^|; )" + name.replace(/([\.$?*|{}\(\)\[\]\\\/\+^])/g, '\\$1') + "=([^;]*)"
        ));
        return matches ? decodeURIComponent(matches[1]) : undefined;
    }

    const cookieQuery = get => {
        if (get) {
            if (getCookie('goodsCart')) {
                Object.assign(goodsCart, JSON.parse(getCookie('goodsCart')));
            }
            checkCount();
        } else {
            document.cookie = `goodsCart=${JSON.stringify(goodsCart)};max-age=86400e3`;
        }
    }

    const storageQuery = get => {
        if (get) {
            if (localStorage.getItem('wishlist')) {
                wishlist.push(...JSON.parse(localStorage.getItem('wishlist')));
            }
            checkCount();
        } else {
            localStorage.setItem('wishlist', JSON.stringify(wishlist));
        }     
    }

    /* События */
    const closeCart = (e) => {
        const target = e.target;
        if (target === cart || target.classList.contains('cart-close')) {
            cart.style.display = '';
        }      
    }

    const openCart = (e) => {
        e.preventDefault();
        cart.style.display = 'flex';

        /* Закрытие корзины по ESC */
        document.addEventListener('keydown', function (e) {
            if (e.keyCode === 27) { 
                cart.style.display = '';
            }
        });

        getGoods(renderCart, showGoodsCart);
    }

    const choiceCategory = e => {
        e.preventDefault();

        const target = e.target;

        if (target.classList.contains('category-item')) {
            const category = target.dataset.category;
            getGoods(renderCard, goods => goods.filter(item => item.category.includes(category)));
        }
    }

    const searchGoods = e => {
        e.preventDefault();

        const input = e.target.elements.searchGoods;
        const inputValue = input.value.trim();
        if (inputValue !== '') {
            const searchString = new RegExp(inputValue, 'i');
            getGoods(renderCard, goods => goods.filter(item => searchString.test(item.title)));
        } else {
            search.classList.add('error');
            setTimeout(() => {
                search.classList.remove('error');
            }, 2000);
        }
        input.value = '';
    }

    const toggleWhishlist = (id, elem) => {
        if (wishlist.indexOf(id) + 1) {
            wishlist.splice(wishlist.indexOf(id), 1);
            elem.classList.remove('active');
        } else {
            wishlist.push(id);
            elem.classList.add('active');
        }
        checkCount();
        storageQuery();
    }

    const addCart = id => {
        if (goodsCart[id]) {
            goodsCart[id] += 1;
        } else {
            goodsCart[id] = 1;
        }
        checkCount();
        cookieQuery();
    }

    const removeGoods = id => {
        delete goodsCart[id];
        checkCount();
        cookieQuery();
        getGoods(renderCart, showGoodsCart);
    }

    /* handlers */
    const handlerGoods = e => {
        const target = e.target;

        if (target.classList.contains('card-add-wishlist')) {
            toggleWhishlist(target.dataset.goodsId, target);
        }

        if (target.classList.contains('card-add-cart')) {
            addCart(target.dataset.goodsId);
        }
    }

    const handlerCart = e => {
        const target = e.target;

        if (target.classList.contains('goods-add-wishlist')) {
            toggleWhishlist(target.dataset.goodsId, target);
        }

        if (target.classList.contains('goods-delete')) {
            removeGoods(target.dataset.goodsId);
        }
    }

    /* Инициализация */
    {
        getGoods(renderCard, randomSort);
        storageQuery(true);
        cookieQuery(true);

        cartBtn.addEventListener('click', openCart);
        cart.addEventListener('click', closeCart);
        category.addEventListener('click', choiceCategory);
        search.addEventListener('submit', searchGoods);
        goodsWrapper.addEventListener('click', handlerGoods);
        cartWrapper.addEventListener('click', handlerCart);
        wishlistBtn.addEventListener('click', showWishlist)
    }
});