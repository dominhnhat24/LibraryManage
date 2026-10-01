// Tạo phản hồi JSON thành công theo cùng một cấu trúc cho các controller.
// Nhận response Express và tùy chọn statusCode/message/data; gửi response rồi trả đối tượng res.
const successResponse = (res, { statusCode = 200, message = 'Success', data = null }) => {
    return res.status(statusCode).json({
        status: 'success',
        message,
        data
    });
};

export default successResponse;
