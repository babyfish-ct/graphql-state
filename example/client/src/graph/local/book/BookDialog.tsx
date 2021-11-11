import { Modal, Form, Input, Collapse } from "antd";
import { useForm } from "antd/lib/form/Form";
import { ModelType } from "graphql-ts-client-api";
import { FC, memo, useCallback, useEffect } from "react";
import UUIDClass from "uuidjs";
import { author$, book$$, bookStore$ } from "../../__generated_local_schema__/fetchers";
import { AuthorMultiSelect } from "../author/AuthorMultiSelect";
import { INFORMATION_CLASS, ACTION_CLASS } from "../Css";
import { BookStoreSelect } from "../store/BookStoreSelect";
import { useTypedStateManager } from "../../__generated_local_schema__";

const BOOK_EDIT_INFO =
    book$$
    .store(bookStore$.id)
    .authors(author$.id)
;

type BookInput = ModelType<typeof book$$> & {
    readonly storeId?: string;
    readonly authorIds: readonly string[];
}

export const BookDialog: FC<{
    value?: ModelType<typeof BOOK_EDIT_INFO>,
    onClose: (value?: ModelType<typeof BOOK_EDIT_INFO>) => void
}> = memo(({value, onClose}) => {

    const [form] = useForm<BookInput>();

    useEffect(() => {
        form.setFieldsValue({
            id: value?.id ?? UUIDClass.generate(),
            name: value?.name ?? "",
            storeId: value?.store?.id,
            authorIds: value?.authors.map(author => author.id) ?? []
        })
    }, [form, value]);

    const stateManager = useTypedStateManager();

    const onOk = useCallback(async () => {
        const input = await form.validateFields();
        const info: ModelType<typeof BOOK_EDIT_INFO> = {
            id: input.id,
            name: input.name,
            store: input.storeId !== undefined ? {id: input.storeId} : undefined,
            authors: input.authorIds.map(authorId => ({id: authorId}))
        };
        if (info.id === undefined) {
            throw new Error();
        }
        stateManager.save(BOOK_EDIT_INFO, info);
        onClose(info);
    }, [form, onClose, stateManager]);

    const onCancel = useCallback(() => {
        onClose();
    }, [onClose]);

    return (
        <Modal
        visible={true}
        title={`${value === undefined ? 'Create' : 'Edit'} Book`}
        onOk={onOk}
        onCancel={onCancel}
        width={1000}>
            <Form form={form} labelCol={{span: 8}} wrapperCol={{span: 16}}>
                <Form.Item name="id" hidden={true}/>
                <Form.Item label="Name" name="name">
                    <Input autoComplete="off"/>
                </Form.Item>
                <Form.Item label="Store" name="storeId">
                    <BookStoreSelect optional={true}/>
                </Form.Item>
                {STORE_DESCRITPION_ITEM}
                <Form.Item label="Authors" name="authorIds">
                    <AuthorMultiSelect/>
                </Form.Item>
                {AUTHORS_DESCRIPTION_ITEM}
            </Form>
        </Modal>
    );
});




/************************************
 * 
 * Document embedded in UI
 * 
 ************************************/

const FOR_OLD_STORE = `
if (oldStore !== undefined && cached(oldStore.books)) {
    oldStore.books.remove(this);
}`;

const FOR_NEW_STORE = `
if (newStore !== undefined && cached(newStore.books)) {
    newStore.books.add(this);
}`;

const STORE_DESCRITPION_ITEM = (
    <Form.Item label=" " colon={false}>
        <Collapse ghost>
            <Collapse.Panel key="title" header="Description of 'Book.store'">
                <div className={INFORMATION_CLASS}>
                    If you change this association "Book.store"
                    <ul>
                        <li>
                            For the old store, this action will be executed automatically
                            <pre className={ACTION_CLASS}>{FOR_OLD_STORE}</pre>
                        </li>
                        <li>
                            For the new store, this action will be executed automatically
                            <pre className={ACTION_CLASS}>{FOR_NEW_STORE}</pre>
                        </li>
                    </ul>
                </div>
            </Collapse.Panel>
        </Collapse>
    </Form.Item>
);

const FOR_REMOVED_AUTHOR = `
if (cached(removeAuthor.books)) {
    removeAuthor.books.remove(this);
}`;

const FOR_ADDED_AUTHOR = `
if (cached(addedAuthor.books)) {
    addedAuthor.books.add(this);
}`;

const AUTHORS_DESCRIPTION_ITEM = (
    <Form.Item label=" " colon={false}>
        <Collapse ghost>
            <Collapse.Panel key="title" header="Description of 'Book.store'">
                <div className={INFORMATION_CLASS}>
                    If you change this association "Book.authors"
                    <ul>
                        <li>
                            For each removed author, this action will be executed automatically
                            <pre className={ACTION_CLASS}>{FOR_REMOVED_AUTHOR}</pre>
                        </li>
                        <li>
                            For each added author, this action will be executed automatically
                            <pre className={ACTION_CLASS}>{FOR_ADDED_AUTHOR}</pre>
                        </li>
                    </ul>
                </div>
            </Collapse.Panel>
        </Collapse>
    </Form.Item>
);
