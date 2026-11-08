# Spot 3.5.5 verification

Added an explicit return button in the notification center. Main Community navigation resets its subview and search; explicit notification/member actions select their intended subview. Location pin and city now share an inline flex group, with the author in a separate wrapping span.

Validated in isolated fixture accounts, without production writes: desktop and a 390px mobile iframe both return from alerts via the new button and Community tab. Arabic and English DOM measurements show a 4px pin/city gap for short and long city names. Shared photo crop behavior is retained. Physical iPhone/Safari testing was not performed.

Release routing covers the new candidate and retained installed versions, including matching CSS and crop helper loading. Publication stays behind the existing Madar approval pipeline.
