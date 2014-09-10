OceanEvaluation
===============

OceanEvaluation is a project I worked on for the OCEAN User Group of
Southern California (http://www.ocean400.org), mostly as a way of
learning to write web applications.  The front-end uses JavaScript and
jQuery; the back-end uses PHP and MySQL.

The purpose of the application is to allow someone to enter data from
conference evaluation forms, collected from the group's annual
conference.  There are two types of forms.  One asks participants to
evaluate the entire conference; the other asks participants to rate
each session they attended.  Sessions can have one or two instructors,
and for a session with two instructors, the form asks for ratings for
both.  The application collects the data and prints statistical
reports. 

The application was designed to make data entry as speedy as possible.
Thus, for the session evaluation forms, the user is able to enter a
number of ratings, from 1 to 5, by pressing the 1 to 5 key (or 0 or
space for missing data), with no need to press Enter or Tab, or to
click on another entry, between keystrokes.  The application shows a
circle around the selected rating.  That way, the user can enter the
data quickly and see a screen that looks approximately like the form
they're entering in, so that they can spot an error quickly.  The
evaluation forms for a session are normally batched together, so that
the user can enter data for one session by adding the information
about the session, then pressing a few number keys for each form.
However, if some forms become separated, it is easy to go back later
and add data for a previously entered session.  The button to accept
the data performs a POST but does not behave like an actual "submit",
so that the browser can stay on the same page, ready for the next
entry. 

To run the application, the user points a browser to `oce_home.html`.

This application works on Chrome.  There are some problems when
running on IE, and I have not attempted to try it on other browsers. 

The directory includes `jquery-1.9.1.js` and `fpdf.php`.  FPDF
(http://www.fpdf.org) is a free PHP class to generate PDF files.

