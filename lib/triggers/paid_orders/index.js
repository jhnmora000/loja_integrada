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
  const date = new Date(timestamp);
  const opts = { timezone: 'America/Sao_Paulo' };
  return date.toLocaleString('pt-BR', opts).replace(' ', 'T');
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
  })
  .then((res) => res.data)
  .catch((err) => { throw err.response.data.error_message; });
}

function search(plg, event, statusId) {
  return get(plg, event, '/pedido/search', {
    limit: 24,
    situacao_id: statusId,
    since_atualizado: formatDate(event.meta.lastReqAt)
  }).then((data) => data.objects);
}

exports.handle = function (plg, event) {
  return Promise.all([
    search(plg, event, 4), // pedido_pago
    search(plg, event, 15) // pedido_em_separacao
  ]).then(async (groups) => {
    const orders = groups[0].concat(groups[1]);

    for (const order of orders) {
      order.numero = await get(plg, event, '/pedido/' + order.numero);
    }

    return orders;
  });
};
