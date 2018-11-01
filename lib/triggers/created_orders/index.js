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

exports.handle = function (plg, event) {
  return get(plg, event, '/pedido/search', {
    limit: 24,
    since_criado: formatDate(event.meta.lastReqAt)
  }).then(async (data) => {
    for (const order of data.objects) {
      order.numero = await get(plg, event, '/pedido/' + order.numero);
    }
    return data.objects;
  });
};
