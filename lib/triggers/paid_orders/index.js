/**
 * Trigger handler
 *
 * @param {object} plg - Pluga developer platform toolbox.
 * @param {object} plg.axios - [axios](https://github.com/axios/axios)
 *
 * @param {object} event - Event bundle to handle.
 * @param {object} event.meta - Pluga event meta data.
 * @param {string} event.meta.baseURI - Environment base URI.
 * @param {number} event.meta.lastReqAt - Last task handle timestamp.
 * @param {object} event.auth - Your app.json auth fields.
 * @param {object} event.input - Your meta.json fields.
 *
 * @returns {Promise} Promise object represents an array of resources to handle.
 */

function formatDate(timestamp) {
  const date = new Date(parseInt( `${timestamp}0000000000000`.substr(0,13) ));
  return date.toLocaleString().replace(' ', 'T');
}

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

function get(plg, event, path, params) {
  const auth = {
    chave_api: event.auth.chave_api,
    chave_aplicacao: event.auth.chave_aplicacao
  };

  return plg.axios({
    method: 'GET',
    url: event.meta.baseURI + path,
    params: Object.assign({}, auth, params || {})
  }).then((res) => res.data).catch((err) => {
    if (err.response) {
      if (err.response.status === 429) {
        return sleep(1000).then(() => get(plg, event, path, params));
      }
      throw new Error(err.response.data);
    } else {
      throw err;
    }
  });
}

function getOrdersPaid(plg, event, lastReqAt, iter = 0, acc = []) {
  return get(plg, event, '/pedido/search', {
    limit: 50,
    offset: iter * 50,
    situacao_id: 4, // pedido_pago
    since_atualizado: lastReqAt
  }).then((data) => {
    const cur = data.objects;
    const orders = acc.concat(cur);
    return cur.length ? getOrdersPaid(plg, event, lastReqAt, iter + 1, orders) : orders;
  });
}

function getOrdersSended(plg, event, lastReqAt, iter = 0, acc = []) {
  return get(plg, event, '/pedido/search', {
    limit: 50,
    offset: iter * 50,
    situacao_id: 11, // pedido_enviado
    since_atualizado: lastReqAt
  }).then((data) => {
    const cur = data.objects;
    const orders = acc.concat(cur);
    return cur.length ? getOrdersSended(plg, event, lastReqAt, iter + 1, orders) : orders;
  });
}

async function getOrders (plg, event, lastReqAt) {
  const paid = await getOrdersPaid(plg, event, lastReqAt);
  const sended = await getOrdersSended(plg, event, lastReqAt);
  return paid.concat(sended);
}

exports.handle = async function (plg, event) {
  process.env.TZ = 'America/Sao_Paulo';

  const lastReqAt = formatDate(event.meta.lastReqAt);
  const orders = await getOrders(plg, event, lastReqAt);
  let i = 0;
  for (const order of orders) {
    order.numero = await get(plg, event, '/pedido/' + order.numero);
  }

  return orders;
};
