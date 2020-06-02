import os.path
import logging
import ConfigParser

# SERVER RUNNING ON WINDOWS: import asyncio

import tornado.httpserver
import tornado.ioloop
import tornado.web
import tornado.websocket

from tornado.options import parse_command_line


#
# RENDER SENSORS WEB APP
#

class MainHandler(tornado.web.RequestHandler):
    def get(self):
        self.render("index.html")


class RequestHandler(tornado.websocket.WebSocketHandler):
    waiters = set()

    def open(self):
        RequestHandler.waiters.add(self)
        print("WebSocket unity opened")

    def on_message(self, message):
        print(message)
        fo = open("vypis.txt","a+")
        fo.write("%s\r\n" %message)
        RequestHandler.send_updates(message)


    def on_close(self):
        RequestHandler.waiters.remove(self)
        print("WebSocket unity closed")

    @classmethod
    def send_updates(cls, message):
        for waiter in cls.waiters:
            try:
                waiter.write_message(message)
            except:
                logging.error("Error sending message")

#
# PYTHON APP INITIALISATION
#
def main():
    # SERVER RUNNING ON WINDOWS: asyncio.set_event_loop_policy(asyncio.WindowsSelectorEventLoopPolicy())
    parse_command_line()

    settings = dict(template_path=os.path.join(os.path.dirname(__file__), "templates"), static_path=os.path.join(os.path.dirname(__file__), "static"))
    handlers = [(r"/", MainHandler), (r"/stream", RequestHandler)]
    
    app = tornado.web.Application(handlers, **settings)

    # TODO: Change <YOUR_CERT_NAME> and <YOUR_KEY_NAME>
    http_server = tornado.httpserver.HTTPServer(app, ssl_options={"certfile": os.path.join(os.path.dirname(__file__), "cert.pem"), "keyfile": os.path.join(os.path.dirname(__file__), "key.pem")})
    http_server.listen(8080)
    tornado.ioloop.IOLoop.current().start()


if __name__ == "__main__":
    main()
