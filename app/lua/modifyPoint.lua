local userKey = KEYS[1]
local queueKey = KEYS[2]
local queueDataJson = ARGV[1]

local queueData = cjson.decode(queueDataJson)
local amount = tonumber(queueData.amount)
local newPoint = -1
local currentPoint = tonumber(redis.call('GET', userKey))    

if currentPoint + amount >= 0 then
  newPoint = currentPoint + amount
  redis.call('SET', userKey, newPoint)
  
  queueData.oldPoint = currentPoint
  queueData.newPoint = newPoint
  
  redis.call('RPUSH', queueKey, cjson.encode(queueData))
end

return {newPoint, currentPoint}
