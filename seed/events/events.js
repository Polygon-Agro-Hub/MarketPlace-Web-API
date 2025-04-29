const {  plantcare, collectionofficer, dash } = require('../../startup/database');


const createExpiredContentCleanupEvent = () => {
    const sql = `
    CREATE EVENT IF NOT EXISTS delete_expired_content
      ON SCHEDULE EVERY 1 DAY
      DO
        DELETE FROM content
        WHERE expireDate IS NOT NULL
        AND expireDate < NOW();
  `;
    return new Promise((resolve, reject) => {
        plantcare.query(sql, (err, result) => {
            if (err) {
                reject('Error createExpiredContentCleanupEvent ' + err);
            } else {
                resolve('createExpiredContentCleanupEvent created successfully.');
            }
        });
    });
};




const createContentPublishingEvent = () => {
    const sql = `
    CREATE EVENT IF NOT EXISTS update_content_status
      ON SCHEDULE EVERY 1 DAY
      DO
        UPDATE content
        SET status = 'Published'
        WHERE publishDate <= CURRENT_DATE()
        AND status != 'Published';
  `;
    return new Promise((resolve, reject) => {
        plantcare.query(sql, (err, result) => {
            if (err) {
                reject('Error createContentPublishingEvent ' + err);
            } else {
                resolve('createContentPublishingEvent created successfully.');
            }
        });
    });
};




const createTaskStatusEvent = () => {
    const sql = `
    CREATE EVENT IF NOT EXISTS update_task_status
        ON SCHEDULE EVERY 1 HOUR
        DO
        UPDATE slavecropcalendardays
        SET status = 'Completed'
        WHERE status = 'Pending' AND startingDate < CURDATE();
  `;
    return new Promise((resolve, reject) => {
        plantcare.query(sql, (err, result) => {
            if (err) {
                reject('Error createTaskStatusEvent ' + err);
            } else {
                resolve('createTaskStatusEvent created successfully.');
            }
        });
    });
};




const createUserActiveStatusEvent = () => {
    const sql = `
    CREATE EVENT IF NOT EXISTS update_user_active_status
        ON SCHEDULE EVERY 1 HOUR
        DO
        BEGIN
            -- Update activeStatus to 'active' for users with a recent task
            UPDATE users u
            SET activeStatus = 'active'
            WHERE EXISTS (
                SELECT 1
                FROM slavecropcalendardays s
                WHERE s.userId = u.id
                AND s.createdAt = (
                    SELECT MAX(createdAt)
                    FROM slavecropcalendardays
                    WHERE userId = s.userId
                    AND status = 'completed'
                )
                AND s.createdAt >= DATE_SUB(CURDATE(), INTERVAL 1 MONTH)
            );

            -- Update activeStatus to 'inactive' for users without a recent task
            UPDATE users u
            SET activeStatus = 'inactive'
            WHERE NOT EXISTS (
                SELECT 1
                FROM slavecropcalendardays s
                WHERE s.userId = u.id
                AND s.createdAt = (
                    SELECT MAX(createdAt)
                    FROM slavecropcalendardays
                    WHERE userId = s.userId
                    AND status = 'completed'
                )
                AND s.createdAt >= DATE_SUB(CURDATE(), INTERVAL 1 MONTH)
            );
        END;
    `;
    return new Promise((resolve, reject) => {
        plantcare.query(sql, (err, result) => {
            if (err) {
                reject('Error createUserActiveStatusEvent: ' + err);
            } else {
                resolve('createUserActiveStatusEvent created successfully.');
            }
        });
    });
};






const createMarketPricevent = () => {
    const sql = `
    DELIMITER $$

    CREATE EVENT IF NOT EXISTS update_marketprice_average
    ON SCHEDULE EVERY 5 MINUTE
    DO
    BEGIN
    UPDATE marketprice mp
    JOIN (
        SELECT 
        marketPriceId, 
        AVG(updatedPrice) AS avg_price
        FROM 
        marketpriceserve
        WHERE 
        updatedPrice IS NOT NULL
        GROUP BY 
        marketPriceId
    ) mps_avg ON mp.id = mps_avg.marketPriceId
    SET mp.averagePrice = mps_avg.avg_price;
    END$$

    DELIMITER ;
    `;
    return new Promise((resolve, reject) => {
        collectionofficer.query(sql, (err, result) => {
            if (err) {
                reject('Error update_marketprice_average Event: ' + err);
            } else {
                resolve('update_marketprice_average event created successfully.');
            }
        });
    });
};





const createStarTargetEvent = () => {
    const sql = `
   DELIMITER $$

    CREATE EVENT IF NOT EXISTS daily_salesagentstars_insert
    ON SCHEDULE EVERY 1 DAY
    STARTS CURRENT_DATE + INTERVAL 1 DAY + INTERVAL 1 MINUTE
    DO
    BEGIN
        -- Get the latest applicable target
        DECLARE latest_target_value DECIMAL(10,2);

        SELECT targetValue INTO latest_target_value
        FROM target
        WHERE startDate <= CURRENT_DATE
        ORDER BY startDate DESC
        LIMIT 1;

        -- Insert for each salesagent
        INSERT INTO salesagentstars (salesagentId, date, target, completed, numOfStars)
        SELECT id, CURRENT_DATE, latest_target_value, 0, 0
        FROM salesagent;

    END$$

    DELIMITER ;

    `;
    return new Promise((resolve, reject) => {
        collectionofficer.query(sql, (err, result) => {
            if (err) {
                reject('Error update_marketprice_average Event: ' + err);
            } else {
                resolve('update_marketprice_average event created successfully.');
            }
        });
    });
};





module.exports = {
  createExpiredContentCleanupEvent,
  createContentPublishingEvent,
  createTaskStatusEvent,
  createUserActiveStatusEvent

};