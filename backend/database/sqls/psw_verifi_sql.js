 const qry = {
    insertVerification: `
        INSERT INTO verification
        (verifi_mail, m_no, verifi_num,
         verifi_purpose, verifi_create_at,
         verifi_end_at, verifi_success)
        VALUES (?, ?, ?, ?, NOW(),
        DATE_ADD(NOW(), INTERVAL 3 MINUTE), 'N')
    `,

    selectValidVerification: `
        SELECT *
        FROM verification
        WHERE verifi_mail = ?
        AND verifi_num = ?
        AND verifi_purpose = ?
        AND verifi_success = 'N'
        AND NOW() <= verifi_end_at
        ORDER BY verifi_create_at DESC
        LIMIT 1
    `
};

module.exports = qry;