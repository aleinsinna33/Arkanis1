import axios from 'axios'

const api = axios.create({ baseURL: '/api' })

// Attach token to every request
api.interceptors.request.use(cfg => {
  const token = localStorage.getItem('arkanis_token')
  if (token) cfg.headers.Authorization = `Bearer ${token}`
  return cfg
})

// Auth
export const register = (data) => api.post('/auth/register', data).then(r => r.data)
export const login    = (data) => api.post('/auth/login', data).then(r => r.data)
export const getMe    = ()     => api.get('/auth/me').then(r => r.data)

// Cards
export const getAllCards  = ()     => api.get('/cards').then(r => r.data)
export const getUserCards = ()     => api.get('/cards/mine').then(r => r.data)

// Battle
export const saveBattleResult = (data) => api.post('/battle/result', data).then(r => r.data)

// Leaderboard
export const getLeaderboard = () => api.get('/leaderboard').then(r => r.data)

// Shop
export const buyCreditsPack = (packId) => api.post('/shop/credits', { packId }).then(r => r.data)
export const buyPower       = (powerId) => api.post('/shop/power', { powerId }).then(r => r.data)
export const claimDaily     = ()         => api.post('/shop/daily').then(r => r.data)
export const spinWheel      = ()         => api.post('/shop/spin').then(r => r.data)

// Premium (Solana)
export const verifyPremiumPurchase = (data) => api.post('/premium/verify', data).then(r => r.data)

// Quests
export const getQuests           = ()         => api.get('/quests').then(r => r.data)
export const updateQuestProgress = (type, value = 1) => api.post('/quests/progress', { type, value }).then(r => r.data)
export const claimQuestReward    = (questId)  => api.post(`/quests/claim/${questId}`).then(r => r.data)

// Levels
export const getMyLevel          = ()         => api.get('/levels/me').then(r => r.data)
export const getAllRanks          = ()         => api.get('/levels/ranks').then(r => r.data)
export const getLevelsLeaderboard= ()         => api.get('/levels/leaderboard').then(r => r.data)
export const getMatchmaking      = ()         => api.get('/levels/matchmaking').then(r => r.data)

export default api
