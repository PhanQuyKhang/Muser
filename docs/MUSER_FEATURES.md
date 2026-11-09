# Muser — Chức năng MVP

## 1. Tổng quan

Muser là ứng dụng âm nhạc trên mobile giúp người dùng khám phá, lưu và nghe nhạc thông qua đề xuất cá nhân hóa, thao tác quẹt và gu âm nhạc của bạn bè.

- Chủ đề: Entertainment App — Music.
- Thời gian dự kiến: 1 tháng cho thiết kế và triển khai MVP.
- Định hướng: catalog nhỏ, trải nghiệm hoàn chỉnh, recommendation theo tag; chưa cần mô hình AI.

## 2. Tài khoản và hồ sơ

- Đăng ký, đăng nhập bằng email và mật khẩu.
- Quên mật khẩu và đăng xuất.
- Chọn username duy nhất để bạn bè tìm kiếm.
- Thiết lập tên hiển thị; sử dụng avatar mặc định trong MVP.
- Chọn các thể loại hoặc mood yêu thích khi bắt đầu để có dữ liệu gợi ý ban đầu.
- Một loại tài khoản người dùng. Quan hệ bạn bè không phải một role riêng.

## 3. Catalog và phát nhạc

- Hiển thị tên bài hát, nghệ sĩ, ảnh bìa và thời lượng.
- Phát audio qua URL từ nguồn được phép sử dụng.
- Play/pause, tua bằng thanh tiến trình và chuyển bài.
- Dùng player chung để giữ trạng thái phát khi chuyển tab trong app.
- Không phát nhiều bài đồng thời.
- Hiển thị trạng thái đang tải, lỗi phát nhạc và cho phép thử lại hoặc bỏ qua.
- Catalog MVP dự kiến khoảng 50–100 bài, đủ đa dạng cho ba mức khám phá.
- Một bài hát có thể có nhiều nghệ sĩ và nhiều tag.

Nguồn nhạc chưa chốt. Có thể đánh giá Jamendo hoặc sử dụng một catalog được cấp quyền. Metadata từ API không tự động cấp quyền phát hay lưu trữ audio.

## 4. Discover — khám phá bằng thao tác quẹt

- Hiển thị từng bài hát được đề xuất để người dùng nghe và quyết định.
- Quẹt phải: thích bài hát và thêm vào Discovery Playlist cá nhân.
- Nếu đang bật chia sẻ, lượt thích mới đồng thời được chia sẻ với bạn bè.
- Quẹt trái: bỏ qua bài hiện tại; không coi là chặn hoặc ghét bài vĩnh viễn.
- Không tạo bản lưu hoặc bản chia sẻ trùng khi quẹt phải một bài đã lưu.

## 5. Familiar Bar và đề xuất cá nhân hóa

Sử dụng một recommendation engine theo tag với ba chế độ, không phải ba hệ thống riêng biệt.

| Chế độ | Hành vi dự kiến |
| --- | --- |
| Familiar | Ưu tiên bài chưa nghe có nhiều tag tương đồng với sở thích hiện tại. |
| Explore | Kết hợp một số tag quen thuộc với thể loại, mood hoặc nghệ sĩ mới. |
| Surprise | Ưu tiên bài ít tương đồng hơn và các nhóm nhạc người dùng ít khám phá. |

- Dữ liệu đầu vào gồm sở thích ban đầu, tag bài hát và các lượt thích.
- Lượt thích tăng trọng số cho những tag liên quan; MVP chưa cần giảm trọng số khi skip.
- Tag được chuẩn hóa về bộ từ vựng nhỏ, có thể bổ sung thủ công cho catalog demo.
- Với catalog nhỏ, việc chấm điểm có thể chạy trên điện thoại.
- Khi không đủ bài phù hợp, nới điều kiện chọn bài và tránh trả về danh sách rỗng.
- Tiêu chí tính điểm và ngưỡng từng mức cần được kiểm thử bằng catalog thực tế.

## 6. Discovery Playlist cá nhân

- Một playlist mặc định chứa các bài người dùng đã thích.
- Xem, phát lại và xóa bài khỏi playlist.
- Xóa bài khỏi playlist đồng thời gỡ phần chia sẻ của người dùng đối với bài đó.
- Lưu bài là lưu tham chiếu đến bài hát, không phải tải file audio về thiết bị.
- MVP chưa hỗ trợ tạo nhiều playlist tùy chỉnh.

## 7. Kết bạn

- Tìm người dùng bằng username chính xác.
- Gửi lời mời kết bạn.
- Xem lời mời đã nhận; chấp nhận hoặc từ chối.
- Xem danh sách bạn bè và hủy kết bạn.
- Không được kết bạn với chính mình hoặc tạo quan hệ/lời mời trùng.
- Chỉ người nhận được chấp nhận lời mời.
- Sau khi hủy kết bạn, hai bên không còn quyền xem nhạc chia sẻ của nhau.

## 8. Tab Friends — khám phá nhạc bạn bè

- Hiển thị các bài hát mà bạn bè đã thích và cho phép chia sẻ.
- Mỗi mục hiển thị bài hát, nghệ sĩ và tên người bạn đã thích bài đó.
- Có thể phát bài hát hoặc lưu vào Discovery Playlist cá nhân.
- Có phân trang hoặc tải thêm, không tải toàn bộ dữ liệu bạn bè một lần.
- Chỉ đọc được dữ liệu chia sẻ của bạn bè đã chấp nhận.
- Chưa có like bài đăng, comment, chat hoặc thông báo đẩy.

## 9. Settings và quyền riêng tư

### Share discoveries with friends

Công tắc cho phép bạn bè xem những bài người dùng lưu bằng cách quẹt phải.

- Lần đầu sử dụng: giải thích rõ tác dụng và cho chọn bật chia sẻ hoặc để sau.
- Mặc định chưa chia sẻ cho đến khi người dùng chủ động bật.
- Khi bật: lượt thích mới được lưu và chia sẻ.
- Khi tắt: các bài từng chia sẻ bị ẩn khỏi bạn bè; playlist cá nhân giữ nguyên.
- Khi bật lại: chỉ những lượt thích mới từ thời điểm bật lại được chia sẻ. Bài cũ không tự xuất hiện lại.
- Trạng thái chia sẻ được lưu cho từng bản lưu để hỗ trợ quy tắc này.
- Lịch sử nghe, email và sở thích cá nhân không được hiển thị trong tab Friends.
- Quyền truy cập phải được kiểm soát ở backend, không chỉ bằng cách ẩn UI.

## 10. Các màn hình chính

1. Đăng nhập / đăng ký / quên mật khẩu.
2. Thiết lập hồ sơ và sở thích ban đầu.
3. Discover: thẻ bài hát, swipe và Familiar Bar.
4. Player: thông tin bài, play/pause, tiến trình và chuyển bài.
5. Library: Discovery Playlist cá nhân.
6. Friends: nhạc bạn bè chia sẻ.
7. Quản lý bạn bè: tìm username, lời mời và danh sách bạn.
8. Settings: hồ sơ, quyền chia sẻ và đăng xuất.

Các màn hình có thể tái sử dụng component player và danh sách bài hát; không bắt buộc mỗi chức năng là một màn hình riêng.

## 11. Định hướng triển khai

- Mobile: Flutter / Dart.
- Audio player: just_audio.
- Backend đề xuất hiện tại: Firebase Authentication và Cloud Firestore.
- Audio: URL từ nguồn được phép sử dụng; nơi lưu file được quyết định sau khi chốt catalog.
- Recommendation: logic Dart theo tag cho MVP.
- Tổ chức code: UI → logic ứng dụng → repository → Firebase/nguồn audio.
- Firestore Security Rules kiểm soát quyền đọc/ghi, quan hệ bạn bè và dữ liệu chia sẻ.
- Không đặt khóa quản trị hoặc bí mật của nhà cung cấp trong app.
- Chưa cần tự host Node.js/Python server.
- Ưu tiên demo Android bằng APK; chưa yêu cầu đưa lên store.

Mục tiêu là sử dụng hạn mức miễn phí cho demo. Cần kiểm tra lại quota và điều khoản trước triển khai; không mặc định Firebase Storage có thể dùng mà không bật billing.

## 12. Ngoài phạm vi MVP

- Recommendation AI/ML được huấn luyện riêng.
- Catalog thương mại quy mô lớn và hệ thống quản lý hợp đồng bản quyền.
- Tải nhạc offline, DRM và đồng bộ nhiều thiết bị đang phát.
- Background playback và điều khiển màn hình khóa: chỉ bổ sung nếu còn thời gian.
- Chat, comment, reaction, thông báo đẩy và feed xã hội phức tạp.
- Nhiều playlist tùy chỉnh, upload nhạc bởi người dùng và trang quản trị riêng.
- Tìm kiếm toàn catalog nâng cao, thanh toán, quảng cáo và gói Premium.

## 13. Tiêu chí demo hoàn chỉnh

- Người dùng tạo tài khoản, chọn sở thích và nhận được đề xuất.
- Phát được nhạc từ URL và điều khiển player.
- Ba mức Familiar Bar tạo ra khác biệt có thể quan sát trong bài được chọn.
- Quẹt phải lưu bài đúng một lần; quẹt trái chuyển sang bài tiếp theo.
- Hai tài khoản có thể gửi/chấp nhận lời mời và xem nhạc được chia sẻ của nhau.
- Tắt chia sẻ làm các bài biến mất khỏi tab Friends; bật lại không tự chia sẻ lại bài cũ.
- Người không phải bạn bè không truy cập được dữ liệu chia sẻ.
- Xóa bài khỏi playlist cũng gỡ chia sẻ tương ứng.
