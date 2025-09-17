local queueKey = KEYS[1]
local maxSize = tonumber(ARGV[1])
local records = redis.call('LRANGE', queueKey, 0, maxSize - 1)
if #records > 0 then
  redis.call('LTRIM', queueKey, maxSize, -1)
end
return records
