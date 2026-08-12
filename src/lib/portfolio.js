// Talks to the Node service in server/. It owns the portfolio table and
// joins live prices in, so nothing is calculated twice.

import serviceAPI from '../api/serviceAPI'

function describe(error, fallback) {
  if (!error.response) {
    return 'Cannot reach the portfolio service. Is it running on port 8082?'
  }
  return error.response.data?.error || fallback
}

export async function fetchPortfolio() {
  try {
    const { data } = await serviceAPI.get('/portfolio')
    return { holdings: data.holdings || [], summary: data.summary || {} }
  } catch (error) {
    throw new Error(describe(error, 'Could not load your portfolio'), { cause: error })
  }
}

export async function addHolding(entry) {
  try {
    const { data } = await serviceAPI.post('/portfolio', entry)
    return data
  } catch (error) {
    throw new Error(describe(error, 'Could not add the holding'), { cause: error })
  }
}

export async function removeHolding(id) {
  try {
    await serviceAPI.delete(`/portfolio/${id}`)
  } catch (error) {
    throw new Error(describe(error, 'Could not remove the holding'), { cause: error })
  }
}
