          SELECT *
          FROM sql2db.orders 
          WHERE order_date >= '${startDate}' AND order_date <= '${endDate}'
