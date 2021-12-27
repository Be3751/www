import {keyId, secretKey} from "./private.js";
import {region, endpoint, tableName} from "./config.js";

AWS.config.update({
    region: region,
    //endpoint: "http://localhost:8000",
    endpoint: endpoint,
    // accessKeyId default can be used while using the downloadable version of DynamoDB. 
    // For security reasons, do not store AWS Credentials in your files. Use Amazon Cognito instead.
    accessKeyId: keyId,
    // secretAccessKey default can be used while using the downloadable version of DynamoDB. 
    // For security reasons, do not store AWS Credentials in your files. Use Amazon Cognito instead.
    secretAccessKey: secretKey
})
const docClient = new AWS.DynamoDB.DocumentClient();
const tableName = tableName;

// チェックボックスで選択されているジャンルを返す（return: Array（e.g. ['シューズ', 'パンプス']））
// 下記は実装の一例．各々，改造して使ってください（使わず消しても良い）
const getSelectedGenres = () => {
    let ret = [];
    let parent = document.getElementById('genre-select-box');
    for (let i = 1; i <= 13; i++) {
        let targetId = 'toggle' + String(i);
        if (document.getElementById(targetId).checked) {
            let gen = parent.getElementsByTagName('label')[i - 1];
            ret.push(gen.innerHTML);
        }
    }
    return ret
}

// ロードアイコンの表示と非表示の切り替え（state: boolean）
const isLoading = (state) => {
    const loading = document.getElementById('loading-icon');
    if (state == true) {
        loading.style.display = 'block';
    } else {
        loading.style.display = 'none';
    }
}

// 全件表示
const dynamoDB_scan_all = () => {
    let params = {
        TableName: tableName
    };
    docClient.scan(params, (err, data) => {
        if (err) {
            // エラー時
            console.log(err);
        } else {
            // 成功時
            console.log(data);
            const parent = document.getElementById('table-wrapper');
            parent.innerHTML = '';
            data.Items.forEach(item => {
                parent.appendChild(createItem(item))
            });
        }
        const item_num = document.getElementById('item-num');
        item_num.innerHTML = data.Count + '件Hit!!!';
    });
}

const base64Decoder = (bin) => {
    let img = new Image();
    img.src = bin;
    return img
}

const createItem = (item = null) => {
    const e = document.createElement('div');
    e.className = 'item-box';
    if (item) {
        const imgbox = document.createElement('div');
        imgbox.className = 'item-thumb';
        const img = document.createElement('img');
        img.src = 'https://jikken3-cds.s3-ap-northeast-1.amazonaws.com/img/' + item.product_id + '.jpg';
        imgbox.appendChild(img);
        const mask = document.createElement('div');
        mask.className = 'item-mask';
        const desc = document.createElement('div');
        desc.className = 'item-desc';
        desc.innerHTML = item.product_info;
        mask.appendChild(desc);
        imgbox.appendChild(mask);
        e.appendChild(imgbox);

        const id = document.createElement('a');
        id.className = 'item-id text-small';
        id.innerHTML = item.product_id;
        e.appendChild(id);

        const fav = document.createElement('a');
        fav.className = 'item-fav text-small';
        fav.innerHTML = '♡' + item.num_of_favorite;
        e.appendChild(fav);

        const brand = document.createElement('a');
        brand.className = 'item-brand text-small';
        brand.innerHTML = item.brand;
        e.appendChild(brand);

        const title = document.createElement('a');
        title.className = 'item-title';
        title.innerHTML = item.product_name;
        e.appendChild(title);

        const price = document.createElement('a');
        price.className = 'item-price';
        price.innerHTML = '¥' + Number(item.price).toLocaleString();
        e.appendChild(price);

        const target = document.createElement('a');
        target.className = 'item-target text-small';
        target.innerHTML = item.target;
        e.appendChild(target);

        const genre = document.createElement('a');
        genre.className = 'item-genre text-small';
        genre.innerHTML = '>> ' + item.genre;
        e.appendChild(genre);

        const stocks = document.createElement('div');
        stocks.className = 'item-stocks';
        let orderedSize = [];
        for (let size in item.stocks) {
            orderedSize.push(Number(size));
        }
        orderedSize.sort();
        for (let size of orderedSize) {
            const s = document.createElement('a');
            s.innerHTML = size.toFixed(1);
            if (item.stocks[size.toFixed(1)] == true) {
                s.className = 'item-stock-available';
            } else {
                s.className = 'item-stock-soldout';
            }
            stocks.appendChild(s);
        }
        e.appendChild(stocks);
    }
    return e
}