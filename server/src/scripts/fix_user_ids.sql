-- 创建或替换清理 user_id 的函数
CREATE OR REPLACE FUNCTION clean_user_id()
RETURNS TRIGGER AS $$
BEGIN
    -- 移除所有引号
    NEW.user_id := regexp_replace(NEW.user_id, '["'']', '', 'g');
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 为 feedback 表添加触发器
DROP TRIGGER IF EXISTS clean_feedback_user_id ON feedback;
CREATE TRIGGER clean_feedback_user_id
    BEFORE INSERT OR UPDATE ON feedback
    FOR EACH ROW
    EXECUTE FUNCTION clean_user_id();

-- 为 exchange_records 表添加触发器
DROP TRIGGER IF EXISTS clean_exchange_records_user_id ON exchange_records;
CREATE TRIGGER clean_exchange_records_user_id
    BEFORE INSERT OR UPDATE ON exchange_records
    FOR EACH ROW
    EXECUTE FUNCTION clean_user_id();

-- 修复现有数据
UPDATE feedback 
SET user_id = regexp_replace(user_id, '["'']', '', 'g')
WHERE user_id ~ '["'']';

UPDATE exchange_records 
SET user_id = regexp_replace(user_id, '["'']', '', 'g')
WHERE user_id ~ '["'']'; 