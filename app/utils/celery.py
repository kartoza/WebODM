import functools
from django.core.cache import cache
from contextlib import contextmanager
from kombu.five import monotonic
from celery.utils.log import get_task_logger

logger = get_task_logger("app.logger")

LOCK_EXPIRE = 60 * 10  # Lock expires in 10 minutes


@contextmanager
def memcache_lock(lock_id):
    timeout_at = monotonic() + LOCK_EXPIRE - 3
    # cache.add fails if the key already exists
    status = cache.add(lock_id, "true", LOCK_EXPIRE)
    try:
        yield status
    finally:
        # memcache delete is very slow, but we have to use it to take
        # advantage of using add() for atomic locking
        if monotonic() < timeout_at and status:
            # don't release the lock if we exceeded the timeout
            # to lessen the chance of releasing an expired lock
            # owned by someone else
            # also don't release the lock if we didn't acquire it
            cache.delete(lock_id)


def single_instance_task(timeout):
    def task_exc(func):
        @functools.wraps(func)
        def wrapper(*args, **kwargs):
            lock_id = "celery-single-instance-" + func.__name__
            logger.info("Lock ID = {}".format(lock_id))
            acquire_lock = lambda: cache.add(lock_id, "true", timeout)  # noqa
            release_lock = lambda: cache.delete(lock_id)  # noqa
            logger.info("Acquire LOCK = {}".format(acquire_lock()))
            if acquire_lock():
                try:
                    func(*args, **kwargs)
                finally:
                    release_lock()
        return wrapper
    return task_exc
