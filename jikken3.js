// ページの読み込みが完了したときの動作
window.onload = () => {
    // dynamoDB_scan_all()
}

// Searchボタンのハンドラ
const onClickSearchHandler = () => {
    // アイテム表示欄を空にする
    const parent = document.getElementById('table-wrapper');
    parent.innerHTML = '';

    // テキストボックスの内容を取得する
    const brandtxt = document.getElementById('txtbox-brand').value;

    const lowesttxt = Number(document.getElementById('txtbox-lowest').value);
    const highesttxt = Number(document.getElementById('txtbox-highest').value);

    // チェックボックスの内容を取得する
    let selectedGenres = [];
    let genreElements = document.getElementsByClassName('genre');
    for(let i=0; i < genreElements.length; i++){
     if(genreElements[i].checked) selectedGenres.push(genreElements[i].value);
    }
    search(brand = brandtxt ,lowest = lowesttxt, highest = highesttxt, genres = selectedGenres);
}

// 並び替えボタンのハンドラ
const onChangeSortHandler = () => {
    const orderIndx = document.getElementById('order').selectedIndex;
    if (orderIndx == 0) {
     //元の順番に戻る or ページのリロード
     sort();
    } else if (orderIndx == 1) {
        // 人気順
     sort('fav');
    } else if (orderIndx == 2) {
        // 価格の安い順
     sort('price_low');
    } else if (orderIndx == 3) {
        // 価格の高い順
        sort('price_high');
    }
}

// 検索クエリの作成と検索結果の反映
const search = (brand = '', lowest = 0, highest = 0, genres = []) => {
    // 引数の型チェック
    if (typeof (brand) != 'string' || typeof (lowest) != 'number' || typeof (highest) != 'number' || typeof (genres) != 'object') {
        return "invalid argument"
    }

    isLoading(true)
    let queryStr = '';
    let EAN = {};  // ExpressionAttributeNames
    let EAV = {}; // ExpressionAttributeValues

    // ブランドに関する条件を追加
    if (brand != '') {
        queryStr += '(#bra=:bra)';
        EAN['#bra'] = 'brand';
        EAV[':bra'] = brand;
    }

    // 価格帯に関する条件を追加
    if(lowest <= highest && highest !== 0){
        queryStr += ' AND (#pri BETWEEN :low AND :high)';
        EAN['#pri'] = 'price';
        EAV[':low'] = lowest;
        EAV[':high'] = highest;
    }

    // ジャンルに関する条件を追加
    if (genres != []) {
        for(let i=0; i < genres.length; i++){
            if(i == 0){
                if(brand != '')queryStr += ' AND (#gen=:gen'+i+')';
                else queryStr += '(#gen=:gen'+i+')';
                EAN['#gen'] = 'genre';
                EAV[':gen'+i] = '';
                EAV[':gen'+i] = genres[i];
            }
            else if(i == genres.length-1){
                queryStr += ' OR (#gen=:gen'+i+')';
                EAN['#gen'] = 'genre';
                EAV[':gen'+i] = '';
                EAV[':gen'+i] = genres[i];
            }
            else{
                queryStr += ' OR (#gen=:gen'+i+')';
                EAN['#gen'] = 'genre';
                EAV[':gen'+i] = '';
                EAV[':gen'+i] = genres[i];
            }
        }
    }

    // 最終的なparamsを作る
    let params
    if (queryStr != '') {
        params = {
            TableName: tableName,
            FilterExpression: queryStr,
            ExpressionAttributeNames: EAN,
            ExpressionAttributeValues: EAV
        };
    } else {
        // 検索条件が何もないとき
        params = { TableName: tableName };
    }
    console.log(params);

    // 検索クエリを投げる
    docClient.scan(params, (err, data) => {
        if (err) {
            // エラーのときの処理
            console.log(err);
            let errStr = '<span style="color:red;">' + 'ERROR<br>' + err + '</span>';
            document.getElementById('table-wrapper').innerHTML = errStr;
        } else {
            // 成功したときの処理
            const parent = document.getElementById('table-wrapper');
            data.Items.forEach(item => {
                parent.appendChild(createItem(item));
            })
        }
        // 検索結果の件数表示
        const item_num = document.getElementById('item-num');
        if(data.Count == null) data.Count = 0; //'null is not an object'を防ぐための条件文
        item_num.innerHTML = data.Count + '件Hit!!!';
        isLoading(false);
    });
}

const sort = (kind='') => {
    //DOM要素の取得と配列の準備
    var parent = document.getElementById('table-wrapper');
    var childrenList = parent.getElementsByClassName('item-box');
    var itemfavs = document.getElementsByClassName('item-fav'); //お気に入り数を示す要素の配列
    var favnum = [] //お気に入り数を保持する配列
    var itemprices = document.getElementsByClassName('item-price'); //価格を示す要素の配列
    var prices = []; //価格を保持する配列

 // 引数の型チェック
    if (typeof (kind) != 'string') {
        return "invalid argument"
    }

    switch(kind){
        case '':
            location.reload();
            break
        case 'fav':
            //fav数の取得
            for(let i=0; i < itemfavs.length; i++){
            favnum[i] = itemfavs[i].innerText;
            favnum[i] = favnum[i].substring(1,favnum[i].length);
            favnum[i] = Number(favnum[i]);
            }
            //降順のソート
            for(let i=0; i < favnum.length; i++){
                for(var j=favnum.length-1; j > 0; j--){
                    if(favnum[j] > favnum[j-1]){
                        let temp = favnum[j];
                        favnum[j] = favnum[j-1];
                        favnum[j-1] = temp;
                        parent.insertBefore(childrenList[j], childrenList[j-1]);
                    }
                }
            }
            console.log('fav-sort');
            break
        case 'price_low':
            for(let i=0; i < itemprices.length; i++){
            prices[i] = itemprices[i].innerText;
                        prices[i] = prices[i].substring(1,prices[i].length); //¥を除去する処理 ex; ¥8,000→8,000
                        prices[i] = prices[i].slice(0, prices[i].length-4) + prices[i].slice(-3); //カンマを除去する処理 ex; 8,000→8000
                        prices[i] = Number(prices[i]);
            }
            for(let i=0; i < prices.length; i++){
                for(var j=prices.length-1; j > 0; j--){
                    if(prices[j] < prices[j-1]){
                        let temp = prices[j];
                        prices[j] = prices[j-1];
                        prices[j-1] = temp;
                        parent.insertBefore(childrenList[j], childrenList[j-1]);
                    }
                }
            }
            console.log('price-low-sort');
            break
        case 'price_high':
            for(let i=0; i < itemprices.length; i++){
                prices[i] = itemprices[i].innerText;
                prices[i] = prices[i].substring(1,prices[i].length); //¥を除去する処理 ex; ¥8,000→8,000
                prices[i] = prices[i].slice(0, prices[i].length-4) + prices[i].slice(-3); //カンマを除去する処理 ex; 8,000→8000
                prices[i] = Number(prices[i]);
            }
            for(let i=0; i < prices.length; i++){
                for(var j=prices.length-1; j > 0; j--){
                    if(prices[j] > prices[j-1]){
                        let temp = prices[j];
                        prices[j] = prices[j-1];
                        prices[j-1] = temp;
                        parent.insertBefore(childrenList[j], childrenList[j-1]);
                    }
                }
            }
            console.log('price-high-sort');
            break
    }
}